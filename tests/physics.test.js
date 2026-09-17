import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,MODES,BOUNDS} from '../dist/physics.js';
test('matching fruit merges once and awards points',()=>{let events=[];const w=new World(e=>events.push(e));w.add(0,240,400);w.add(0,265,400);w.step();assert.equal(events.length,1);assert.equal(w.bodies.length,1);assert.equal(w.bodies[0].type,1);assert.equal(events[0].points,4);});
test('two watermelons clear the pool',()=>{const w=new World();w.add(8,220,440);w.add(8,300,440);w.step();assert.equal(w.bodies.length,0);});
test('all modes settle within the pool and stir moves fruit',()=>{for(const mode of Object.keys(MODES)){const w=new World();w.mode=mode;w.add(3,250,300);for(let i=0;i<400;i++)w.step();assert.ok(w.bodies[0].p.every(p=>Number.isFinite(p.x)&&p.y<=BOUNDS.bottom+0.01));const y=w.bodies[0].y;w.stir();for(let i=0;i<10;i++)w.step();assert.ok(w.bodies[0].y<y);}});
test('stable overflow accumulates three second danger',()=>{const w=new World();const b=w.add(0,250,80);b.age=2;for(let i=0;i<365;i++){for(let j=0;j<b.p.length;j++){const a=Math.PI*2*j/b.p.length;b.p[j]={x:250+18*Math.cos(a),y:80+18*Math.sin(a),px:250+18*Math.cos(a),py:80+18*Math.sin(a)};}w.step();}assert.ok(b.danger>=3);});
