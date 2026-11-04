import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";
const names = text => Object.fromEntries(text.split(" ").map(name => [name, name]));
const nodes = (tree, type) => Array.isArray(tree) ? tree.flatMap(item => nodes(item, type)) : !tree || typeof tree !== "object" ? [] : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
const tick = () => new Promise(resolve => setImmediate(resolve));
function dialog(upload) {
 const slots = [], calls = []; let cursor = 0;
 const { UploadCvDialog } = actionLoader(undefined, {
  react: { useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i], value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}]; }, useRef(initial) { const i=cursor++; if (!(i in slots)) slots[i]={current:initial};return slots[i]; } },
  "react/jsx-runtime":jsxRuntime, "next/navigation":{useRouter:()=>({refresh(){}})},
  "lucide-react":names("UploadCloud Loader2"), "@/components/ui/button":names("Button"), "@/components/ui/input":names("Input"), "@/components/ui/label":names("Label"),
  "@/components/ui/dialog":names("Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle DialogTrigger"),
  "@/lib/api/recruitment":{uploadCandidateCv:async(...args)=>{calls.push(args);return upload(...args);}},
 }).load("app/(admin)/hr/recruitment/[id]/components/upload-cv-dialog.tsx");
 return {calls,render(){cursor=0;return UploadCvDialog({roleId:'role',roleTitle:'Developer'});}};
}
function add(control, files) { nodes(control.render(),'input')[0].props.onChange({target:{files}}); }
function submit(control) { nodes(control.render(),'form')[0].props.onSubmit({preventDefault(){}}); }

test('bulk upload retains successes and retries only failed files with the same idempotency ID', async()=>{
 let fail=true;
 const control=dialog(async(_,body)=>body.get('cv_file').name==='B.txt'&&fail?{success:false,error:'Temporary failure'}:{success:true,data:{id:'created'}});
 add(control,[new File(['A CV'],'A.txt'),new File(['B CV'],'B.txt')]);
 assert.equal(nodes(control.render(),'input')[0].props.multiple,true);
 submit(control);await tick();await tick();
 assert.equal(control.calls.length,2);
 const failedId=control.calls[1][1].get('upload_id');
 assert.ok(nodes(control.render(),'p').some(node=>node.props.children==='Temporary failure'));
 fail=false;submit(control);await tick();await tick();
 assert.equal(control.calls.length,3);
 assert.equal(control.calls[2][1].get('cv_file').name,'B.txt');
 assert.equal(control.calls[2][1].get('upload_id'),failedId);
});

test('possible duplicates require the explicit Upload anyway action',async()=>{
 const control=dialog(async(_,body)=>body.get('allow_duplicate')?{success:true,data:{id:'created'}}:{success:false,errorCode:'CV_DUPLICATE',error:'Matching CV already exists'});
 add(control,[new File(['same CV'],'Ada.txt')]);submit(control);await tick();await tick();
 const tree=control.render();
 const override=nodes(tree,'Button').find(node=>node.props.children==='Upload anyway');assert.ok(override);
 submit(control);await tick();assert.equal(control.calls.length,1);
 override.props.onClick();await tick();await tick();
 assert.equal(control.calls[1][1].get('allow_duplicate'),'1');
});

test('file limits and invalid documents are rejected before any upload',()=>{
 const {cvFileError,CV_UPLOAD_LIMIT}=actionLoader().load('lib/recruitment/cv-intake.ts');
 assert.equal(CV_UPLOAD_LIMIT,20);
 assert.match(cvFileError({name:'archive.zip',size:100}),/PDF/);
 assert.match(cvFileError({name:'big.pdf',size:16*1024*1024}),/15 MB/);
 const control=dialog(async()=>{throw Error('must not upload');});
 add(control,Array.from({length:21},(_,i)=>new File(['CV'],`${i}.txt`)));
 assert.equal(nodes(control.render(),'section').length,0);
 assert.ok(nodes(control.render(),'p').some(node=>node.props.role==='alert'));
});

test('the batch helper caps concurrent work and processes every item once',async()=>{
 const {runRecruitmentBatch}=actionLoader().load('lib/recruitment/cv-intake.ts');
 let active=0,max=0;const seen=[];
 await runRecruitmentBatch([1,2,3,4,5],async item=>{active++;max=Math.max(max,active);await tick();seen.push(item);active--;});
 assert.equal(max,2);assert.deepEqual(seen.sort(),[1,2,3,4,5]);
});

test('detailed interview preparation runs only on request and keeps the compact evidence visible', async()=>{
 const slots=[],effects=[];let cursor=0,calls=0,finish;
 const candidate={id:'ada',name:'Ada',ai_score:75,ai_evaluation:{status:'completed',criteria:[{requirement:'Reconciliation',status:'met',evidence:'Reconciled accounts in 2020.'}]}};
 const {CvAnalysisSheet}=actionLoader(undefined,{
  react:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect(callback,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>slots[i][j]!==v)){slots[i]=deps;effects.push(callback);}}},
  'react/jsx-runtime':jsxRuntime,'lucide-react':names('Loader2 RotateCw'),'@/components/ui/button':names('Button'),
  '@/components/ui/sheet':names('Sheet SheetContent SheetDescription SheetHeader SheetTitle'),
  '../../components/pipeline-disclosure':names('PipelineDisclosure'),
  '@/lib/api/recruitment-pipeline':{getRecruitmentScreeningStatus:async()=>({...candidate,interview_preparation:null})},
  '@/lib/api/recruitment':{prepareCandidateInterview:async()=>{calls++;return new Promise(resolve=>{finish=resolve;});}},
 }).load('app/(admin)/hr/recruitment/[id]/components/cv-analysis-sheet.tsx');
 const render=()=>{cursor=0;const tree=CvAnalysisSheet({candidate,onClose(){},onManage(){},onRetry:async()=>{},retrying:false});effects.splice(0).forEach(effect=>effect());return tree;};
 render();await tick();let tree=render();
 assert.equal(calls,0);assert.ok(nodes(tree,'p').some(node=>node.props.children==='Reconciled accounts in 2020.'));
 const generate=nodes(tree,'Button').find(node=>node.props.children==='Generate interview questions');
 generate.props.onClick();generate.props.onClick();assert.equal(calls,1);
 finish({success:true,data:{status:'completed',probes:[{category:'Verification',cv_trigger:'2020 accounts role',question:'How did you investigate differences?',what_to_listen_for:'Specific source checks.'}]}});
 await tick();tree=render();
 assert.ok(nodes(tree,'p').some(node=>node.props.children==='How did you investigate differences?'));
 assert.ok(!nodes(tree,'Button').some(node=>node.props.children==='Generate interview questions'));
});
