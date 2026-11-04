import test from 'node:test';
import assert from 'node:assert/strict';
import * as jsxRuntime from 'react/jsx-runtime';
import {actionLoader} from '../lib/api/action-test-utils.mjs';
const names=text=>Object.fromEntries(text.split(' ').map(name=>[name,name]));
const nodes=(tree,type)=>Array.isArray(tree)?tree.flatMap(item=>nodes(item,type)):!tree||typeof tree!=='object'?[]:[...(tree.type===type?[tree]:[]),...nodes(tree.props?.children,type)];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const fixture=()=>({templates:[{key:'call_screening_pass',stage:'call_screening',stage_label:'Call screening',outcome:'pass',subject_template:'Next step',body_template:'Hi {{applicant_name}}',field_definitions:[{key:'interviewer',label:'Interviewer',type:'text',required:true}]},{key:'call_screening_fail',stage:'call_screening',stage_label:'Call screening',outcome:'fail',subject_template:'Application update',body_template:'Hi {{applicant_name}}',field_definitions:[]},{key:'oral_interview_pass',stage:'oral_interview',stage_label:'Oral interview',outcome:'pass',field_definitions:[]},{key:'oral_interview_fail',stage:'oral_interview',stage_label:'Oral interview',outcome:'fail',field_definitions:[]}],signature_html:'<p>HR Signature</p>',cc:null,reply_to:'hr@aspomtravels.com',history:[]});
function control(options={}) {
 const slots=[],calls=[],records=new Map();let cursor=0;
 const record=(id,input,status)=>({id,...input,template_fields:input.fields,revision:input.revision+1,status,sender:{id:'hr',name:'HR'},sent_at:status==='sent'?'2026-11-01T12:00:00Z':null,updated_at:'2026-11-01T12:00:00Z'});
 const mutate=action=>async(id,input)=>{
  calls.push([action,id,input]);
  if(options[action])return options[action](id,input,records);
  const result=record(id,input,action==='send'?'sent':'draft');
  if(action==='prepare'){result.subject='Application next step';result.body=`Hi ${input.applicant_name},\n\nInterview with ${input.fields.interviewer ?? 'HR'}.`;}
  records.set(id,result);return {success:true,data:result};
 };
 const Component=actionLoader(undefined,{
  react:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];}},
  'react/jsx-runtime':jsxRuntime,'lucide-react':names('Mail'),'@/components/ui/button':names('Button'),'@/components/ui/input':names('Input'),'@/components/ui/label':names('Label'),'@/components/ui/textarea':names('Textarea'),
  '@/components/ui/dialog':names('Dialog DialogContent DialogDescription DialogHeader DialogTitle'),
  '@/lib/api/standalone-recruitment-email':{
   getStandaloneEmailComposer:async()=>{calls.push(['catalog']);return fixture();},
   getStandaloneEmail:async id=>{calls.push(['load',id]);return records.get(id);},
   prepareStandaloneEmail:mutate('prepare'),saveStandaloneEmail:mutate('save'),sendStandaloneEmail:mutate('send'),
  },
 }).load('app/(admin)/hr/recruitment/components/standalone-recruitment-email-dialog.tsx').StandaloneRecruitmentEmailDialog;
 const render=()=>{cursor=0;return Component({initialData:fixture()});};
 const launch=()=>nodes(render(),'Button').find(node=>Array.isArray(node.props.children)&&node.props.children.includes('Send recruitment email')).props.onClick();
 const edit=(id,value)=>[...nodes(render(),'Input'),...nodes(render(),'Textarea'),...nodes(render(),'select')].find(node=>node.props.id===id).props.onChange({target:{value}});
 const submit=()=>nodes(render(),'form')[0].props.onSubmit({preventDefault(){}});
 return {calls,records,render,launch,edit,submit};
}

test('HR prepares an external applicant message, edits it and sends once with the entered details',async()=>{
 let finish;
 const c=control({send:async(id,input,records)=>new Promise(resolve=>{finish=()=>resolve({success:true,data:{...records.get(id),...input,status:'sent',revision:2}});})});
 c.launch();
 assert.equal(c.calls.length,0,'server prefills avoid an opening request');
 assert.equal(nodes(c.render(),'Button').find(node=>node.props.type==='submit').props.disabled,true);
 c.edit('standalone-applicant_name','Ada External');c.edit('standalone-recipient','ada@example.test');c.edit('standalone-role_title','Developer');c.edit('standalone-interviewer','Finance team');
 c.submit();await tick();
 assert.equal(c.calls[0][0],'prepare');
 assert.equal(nodes(c.render(),'Textarea').find(node=>node.props.id==='standalone-body').props.value,'Hi Ada External,\n\nInterview with Finance team.');
 c.edit('standalone-subject','A personal invitation');c.edit('standalone-body','Hi Ada, please join the interview on Tuesday.');
 c.submit();c.submit();assert.equal(c.calls.filter(call=>call[0]==='send').length,1);
 const input=c.calls.find(call=>call[0]==='send')[2];
 assert.equal(input.recipient,'ada@example.test');assert.equal(input.subject,'A personal invitation');assert.equal(input.fields.interviewer,'Finance team');assert.equal(input.revision,1);
 finish();await tick();
 assert.ok(nodes(c.render(),'Button').some(node=>node.props.children==='New email'));
});

test('closing saves partial details and the same draft is available when reopened',async()=>{
 const c=control();c.launch();c.edit('standalone-applicant_name','Unfinished applicant');
 nodes(c.render(),'Dialog')[0].props.onOpenChange(false);await tick();
 assert.equal(c.calls[0][0],'save');assert.equal(c.calls[0][2].recipient,'');
 assert.equal(nodes(c.render(),'Dialog').length,0);
 c.launch();assert.equal(nodes(c.render(),'Input').find(node=>node.props.id==='standalone-applicant_name').props.value,'Unfinished applicant');
 assert.equal(c.records.size,1);
});

test('changing the stage or pass/fail selects the matching fields and prevents incomplete sends',async()=>{
 const c=control();c.launch();c.edit('standalone-applicant_name','Ada');c.edit('standalone-recipient','ada@example.test');c.edit('standalone-role_title','Developer');
 assert.equal(nodes(c.render(),'Button').find(node=>node.props.type==='submit').props.disabled,true);
 c.edit('standalone-outcome','fail');
 assert.ok(!nodes(c.render(),'Input').some(node=>node.props.id==='standalone-interviewer'));
 assert.equal(nodes(c.render(),'Button').find(node=>node.props.type==='submit').props.disabled,false);
 c.edit('standalone-stage','oral_interview');c.submit();await tick();
 assert.equal(c.calls[0][2].template,'oral_interview_fail');
 c.edit('standalone-body','Please submit by [deadline].');
 assert.equal(nodes(c.render(),'Button').find(node=>node.props.type==='submit').props.disabled,true);
});

test('failed saves retain edits and keep the composer open',async()=>{
 const c=control({save:async()=>({success:false,error:'Could not save',code:'HTTP_500'})});c.launch();c.edit('standalone-applicant_name','Keep these edits');
 nodes(c.render(),'Dialog')[0].props.onOpenChange(false);await tick();
 assert.equal(nodes(c.render(),'Dialog').length,1);
 assert.equal(nodes(c.render(),'Input').find(node=>node.props.id==='standalone-applicant_name').props.value,'Keep these edits');
 assert.ok(nodes(c.render(),'p').some(node=>node.props.role==='alert'&&node.props.children==='Could not save'));
});

test('standalone email actions use dedicated endpoints and return revisioned records',async()=>{
 const calls=[];const actions=actionLoader(async(method,url,input)=>{calls.push([method,url,input]);return{success:true,data:{data:method==='get'&&url.endsWith('composer')?fixture():{id:'external',revision:2}}};}).load('lib/api/standalone-recruitment-email.ts');
 await actions.getStandaloneEmailComposer();await actions.getStandaloneEmail('external');await actions.saveStandaloneEmail('external',{revision:1});await actions.prepareStandaloneEmail('external',{revision:1});
 assert.equal((await actions.sendStandaloneEmail('external',{revision:1})).data.revision,2);
 assert.deepEqual(calls.map(call=>[call[0],call[1]]),[['get','/api/recruitment/emails/composer'],['get','/api/recruitment/emails/external'],['put','/api/recruitment/emails/external'],['post','/api/recruitment/emails/external/prepare'],['post','/api/recruitment/emails/external/send']]);
});
