
kernel void sfc_direct_prepare(const device uint* records [[buffer(0)]],
    device uint* tables [[buffer(1)]], constant uint& count [[buffer(2)]],
    uint i [[thread_position_in_grid]]) {
    if(i>=count) return;
    U256x z,r,s;
    for(uint k=0;k<8;++k) {
        z.w[k]=records[i*25+k]; r.w[k]=records[i*25+8+k]; s.w[k]=records[i*25+16+k];
    }
    U256x ri=inverse_scalar(scalar_record(records,i));
    prepare_windowed<true>(z,r,s,records[i*25+24],ri,tables+i*273);
}
kernel void sfc_direct_recover(const device uint* tables [[buffer(0)]],
    device uint* results [[buffer(1)]], constant uint& count [[buffer(2)]],
    uint i [[thread_position_in_grid]]) {
    if(i>=count) return;
    U256x x=zero256(),y=zero256(),z=zero256();
    bool valid=recover_windowed(tables+i*273,x,y,z);
    if(valid) { U256x zi=inverse_field(z),zi2=fmul(zi,zi); x=fmul(x,zi2); y=fmul(y,fmul(zi,zi2)); }
    results[i*17]=valid ? 1u : 0u;
    for(uint k=0;k<8;++k) {
        results[i*17+1+k]=valid ? x.w[k] : 0u;
        results[i*17+9+k]=valid ? y.w[k] : 0u;
    }
}
kernel void sfc_cooperative_prepare(const device uint* records [[buffer(0)]],
    device uint* tables [[buffer(1)]], constant uint& count [[buffer(2)]],
    uint tid [[thread_position_in_grid]]) {
    uint padded=((count+31)/32)*32;
    uint task=tid/padded,i=tid%padded;
    if(i>=count) return;
    if(task==0) prepare_cooperative_metadata(records,i,tables+i*273);
    else prepare_cooperative_points(records,i,tables+i*273);
}
kernel void sfc_cooperative_terms(const device uint* tables [[buffer(0)]],
    device uint* points [[buffer(1)]], constant uint& count [[buffer(2)]],
    uint tid [[thread_position_in_grid]]) {
    uint padded=((count+31)/32)*32;
    uint term=tid/padded,i=tid%padded;
    if(i>=count) return;
    JPoint q=recover_cooperative_term(tables+i*273,term);
    for(uint k=0;k<8;++k) {
        points[i*72+term*24+k]=q.x.w[k];
        points[i*72+term*24+8+k]=q.y.w[k];
        points[i*72+term*24+16+k]=q.z.w[k];
    }
}
kernel void sfc_cooperative_join(const device uint* points [[buffer(0)]],
    device uint* results [[buffer(1)]], constant uint& count [[buffer(2)]],
    uint i [[thread_position_in_grid]]) {
    if(i>=count) return;
    JPoint q=infinity();
    for(uint term=0;term<3;++term) {
        JPoint p;
        for(uint k=0;k<8;++k) {
            p.x.w[k]=points[i*72+term*24+k];
            p.y.w[k]=points[i*72+term*24+8+k];
            p.z.w[k]=points[i*72+term*24+16+k];
        }
        q=point_add_jacobian(q,p);
    }
    bool valid=!is_zero(q.z);
    if(valid) { U256x zi=inverse_field(q.z),zi2=fmul(zi,zi); q.x=fmul(q.x,zi2); q.y=fmul(q.y,fmul(zi,zi2)); }
    results[i*17]=valid ? 1u : 0u;
    for(uint k=0;k<8;++k) {
        results[i*17+1+k]=valid ? q.x.w[k] : 0u;
        results[i*17+9+k]=valid ? q.y.w[k] : 0u;
    }
}
