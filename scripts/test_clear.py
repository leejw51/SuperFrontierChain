#!/usr/bin/env python3
"""Exercise destructive make targets only inside disposable directories."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ClearTests(unittest.TestCase):
    def test_clear_and_clearall(self):
        for target in ('clear', 'clearall'):
            with self.subTest(target=target), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                repo = root / 'repo'
                repo.mkdir()
                shutil.copyfile(ROOT / 'Makefile', repo / 'Makefile')
                (repo / 'scripts').mkdir()
                # The real stop command is independently covered by supervisor tests.
                (repo / 'scripts/stress_supervisor.py').write_text(
                    "import sys\nfrom pathlib import Path\n"
                    "assert sys.argv[1:] == ['stop']\n"
                    "assert Path('.sfc-old/data').exists()\n"
                    "Path('stopped').touch()\n")
                persist = root / 'persist'
                removed = [persist / x for x in ('node', 'stress', 'testnet')]
                removed += [repo / '.sfc-old']
                kept = [persist / 'supervisor', repo / '.sfc-processes',
                        repo / 'target', root / 'external']
                for path in removed + kept:
                    (path / 'data').mkdir(parents=True)
                    (path / 'data/marker').write_text('keep or remove')
                (repo / '.sfc-symlink').symlink_to(root / 'external', target_is_directory=True)
                subprocess.run(['make', target, f'PERSIST_DIR={persist}'],
                               cwd=repo, check=True, capture_output=True, text=True)
                self.assertTrue((repo / 'stopped').exists())
                for path in removed:
                    self.assertFalse(path.exists(), path)
                for path in kept:
                    self.assertTrue((path / 'data/marker').exists(), path)
                self.assertTrue((repo / '.sfc-symlink').is_symlink())


if __name__ == '__main__':
    unittest.main()
