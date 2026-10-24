// Mathematical and scroll-boundary regressions. Run: node tests/digging-motion.cjs
const assert=require('node:assert/strict');
const M=require('../digging-motion-model.js');
assert.deepEqual(M.iterations,[3,10,5,16,8,4,2,1,4,2,1]);
assert.equal(M.iterations.indexOf(1),7);
assert.equal(M.iterations[8],4);
assert.equal(M.iterations[10],1);
assert.deepEqual(M.cycleInfo(3),{entry:5,period:3,firstRepeat:8});
assert.deepEqual(M.cycleInfo(4),{entry:0,period:3,firstRepeat:3});
for(const start of [1,2,3,4,-1,-3,-5,-17]) {
 const info=M.cycleInfo(start), seq=M.orbit(start,info.firstRepeat+info.period);
 assert.equal(seq[info.entry],seq[info.firstRepeat]);
 assert.equal(new Set(seq.slice(info.entry,info.firstRepeat)).size,info.period);
}
assert.deepEqual(M.negative,[-3,-8,-4,-2,-1,-2]);
assert.deepEqual(M.magnitudes,[3,8,4,2,1,2]);
assert.deepEqual(M.positive,[3,10,5,16,8,4]);
for(let m=1;m<=100;m++) {
 const n=-BigInt(m), exact=n%2n===0n?n/2n:3n*n+1n;
 assert.equal(BigInt(Math.abs(M.next(-m))),exact<0n?-exact:exact);
 assert.equal(Math.abs(M.next(-m)),m%2===0?m/2:3*m-1);
}
for(let step=0;step<=9;step++) {
 const f=M.reflectionFrame(step);
 for(const key of ['negativeIndex','magnitudeIndex','positiveIndex'])assert.ok(f[key]>=-1&&f[key]<6);
 if(step<3)assert.equal(f.magnitudeIndex,-1);
 if(step<4)assert.equal(f.positiveIndex,-1);
}
assert.deepEqual(M.reflectionFrame(9),{negativeIndex:5,magnitudeIndex:5,positiveIndex:5});
for(const targets of [[0,3,7,10],[0,5,8,14],[0,2,3,9],[0,3,6,9]]) {
 const centres=[100,300,500,700];
 assert.equal(M.scrollStep(centres,targets,0),0);
 assert.equal(M.scrollStep(centres,targets,900),targets[3]);
 centres.forEach((c,i)=>assert.equal(M.scrollStep(centres,targets,c),targets[i]));
 const forward=Array.from({length:801},(_,i)=>M.scrollStep(centres,targets,i));
 forward.slice(1).forEach((s,i)=>assert.ok(s>=forward[i]));
 assert.deepEqual(Array.from({length:801},(_,i)=>M.scrollStep(centres,targets,800-i)),[...forward].reverse());
}
console.log('PASS: iterate counts, first cycle entry/return, least periods, signed/magnitude arithmetic, reflection phases and reversible scroll boundaries.');
