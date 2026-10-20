//! Host-only observations, never used in execution or consensus.
use serde_json::{json, Value};
use std::{
    sync::{Mutex, OnceLock},
    time::{Duration, Instant},
};
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System};

struct Sampler {
    system: System,
    sampled: Option<Instant>,
    pids: Vec<Pid>,
    value: Value,
}

pub fn sample(worker: Option<u32>) -> Value {
    static SAMPLER: OnceLock<Mutex<Sampler>> = OnceLock::new();
    let mut sampler = SAMPLER
        .get_or_init(|| {
            Mutex::new(Sampler {
                system: System::new(),
                sampled: None,
                pids: vec![],
                value: Value::Null,
            })
        })
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    let mut pids = vec![Pid::from_u32(std::process::id())];
    if let Some(pid) = worker {
        pids.push(Pid::from_u32(pid));
    }
    if sampler.pids == pids
        && sampler
            .sampled
            .is_some_and(|t| t.elapsed() < Duration::from_secs(1))
    {
        return sampler.value.clone();
    }
    let ready = sampler.pids == pids && sampler.sampled.is_some();
    let elapsed = sampler.sampled.map(|t| t.elapsed().as_secs_f64());
    sampler.system.refresh_processes_specifics(
        ProcessesToUpdate::Some(&pids),
        true,
        ProcessRefreshKind::nothing().with_cpu().with_memory(),
    );
    let mut processes = Vec::new();
    for (i, pid) in pids.iter().enumerate() {
        if let Some(process) = sampler.system.process(*pid) {
            let threads = process.tasks().map(|tasks| tasks.len());
            #[cfg(target_os = "macos")]
            let threads = threads.or_else(|| {
                let output = std::process::Command::new("ps")
                    .args(["-M", "-p", &pid.to_string()])
                    .output()
                    .ok()?;
                output.status.success().then(|| {
                    String::from_utf8_lossy(&output.stdout)
                        .lines()
                        .count()
                        .saturating_sub(1)
                })
            });
            processes.push(json!({"role":if i==0 {"Rust node"} else {"MLX GPU host"},
                "pid":pid.as_u32(),"cpuPercent":if ready {Some(process.cpu_usage())} else {None},
                "residentBytes":process.memory(),"osThreads":threads}));
        }
    }
    sampler.value = json!({"processes":processes,"sampleSeconds":elapsed,
        "cpuPercent":if ready {Some(processes.iter().filter_map(|p|p["cpuPercent"].as_f64()).sum::<f64>())} else {None},
        "cpuDefinition":"100% = one CPU core; Rust node + MLX worker; excludes load generator",
        "rayonThreads":rayon::current_num_threads(),"logicalCpus":std::thread::available_parallelism().map(|n|n.get()).ok(),
        "indexerThreads":1,"gpuUtilizationPercent":null,
        "gpuUtilizationNote":"Hardware utilization is not sampled; verifier counters measure actual CPU/GPU work."});
    sampler.sampled = Some(Instant::now());
    sampler.pids = pids;
    sampler.value.clone()
}
