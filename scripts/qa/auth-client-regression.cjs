// Keep the backend-owned QA script read-only while supplying browser Web Crypto
// to its VM. All assertions and production modules are the existing ones.
const fs=require('fs'),path=require('path'),Module=require('module');
const filename=path.resolve(__dirname,'../../../Eema-backend/scripts/qa/auth-client-check.cjs');
let source=fs.readFileSync(filename,'utf8');
const marker='vm.createContext({window,';
if(!source.includes(marker))throw Error('Auth test harness changed: review Web Crypto injection');
source=source.replace(marker,'vm.createContext({crypto:require("crypto").webcrypto,window,');
const run=new Module(filename,module);run.filename=filename;run.paths=module.paths;run._compile(source,filename);
