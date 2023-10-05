import 'dotenv/config';
import * as d from './discord';
import * as b from './bancho';
import * as p from './polling';

d.init();
b.init();
p.init();
