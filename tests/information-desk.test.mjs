import test from 'node:test';
import assert from 'node:assert/strict';
import * as jsxRuntime from 'react/jsx-runtime';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const names=s=>Object.fromEntries(s.split(' ').map(n=>[n,n]));
const nodes=(tree,type)=>Array.isArray(tree)?tree.flatMap(x=>nodes(x,type)):!tree||typeof tree!=='object'?[]:[...(tree.type===type?[tree]:[]),...nodes(tree.props?.children,type)];
const text=tree=>Array.isArray(tree)?tree.map(text).join(''):typeof tree==='string'||typeof tree==='number'?String(tree):tree&&typeof tree==='object'?text(tree.props?.children):'';
const entry={id:'entry-1',category:'Checklist',country:'Example country',title:'Birth Services reference checklist',content:JSON.stringify({type:'checklist',items:['Check the current guidance']})};
const common={
 'react/jsx-runtime':jsxRuntime,'lucide-react':new Proxy({},{get:(_,key)=>String(key)}),
 '@/components/ui/button':names('Button'),'@/components/ui/input':names('Input'),'@/components/ui/label':names('Label'),
 '@/components/ui/tabs':names('Tabs TabsList TabsTrigger TabsContent'),
 '@/components/ui/accordion':names('Accordion AccordionContent AccordionItem AccordionTrigger'),
 '@/components/ui/alert-dialog':names('AlertDialog AlertDialogAction AlertDialogCancel AlertDialogContent AlertDialogDescription AlertDialogFooter AlertDialogHeader AlertDialogTitle AlertDialogTrigger'),
 'next/dynamic':{default:()=> 'RichEditor'},'react-quill-new/dist/quill.snow.css':{},
};
function formControl({record=null,desk='birth-services',result={success:true}}={}){
 const slots=[],calls=[],routes=[];let cursor=0;
 const Component=actionLoader(undefined,{...common,
  react:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];}},
  'next/navigation':{useRouter:()=>({push:url=>routes.push(url),refresh:()=>routes.push('refresh')})},
  '@/lib/api/information-desk':{createInformationEntry:async(...args)=>{calls.push(['create',...args]);return result;},updateInformationEntry:async(...args)=>{calls.push(['update',...args]);return result;}},
  sonner:{toast:{success(){},error(){}}},
 }).load('components/information-desk/manage-info-form.tsx').ManageInfoForm;
 const render=()=>{cursor=0;return Component({infoRecord:record,desk});};
 const save=()=>nodes(render(),'Button').find(n=>text(n).includes(record?'Save Changes':'Save Information')).props.onClick();
 return{calls,routes,render,save,edit(id,value){nodes(render(),'Input').find(n=>n.props.id===id).props.onChange({target:{value}});}};
}

test('birth and visa views use their own headings, category filters and management routes',()=>{
 const routes=[];
 const View=actionLoader(undefined,{...common,'next/navigation':{useRouter:()=>({push:url=>routes.push(url)})},'./information-accordion':names('InformationAccordion')}).load('components/information-desk/information-desk-view.tsx').InformationDeskView;
 const faq={...entry,id:'faq',category:'FAQ'};
 let tree=View({desk:'birth-services',information:[entry,faq],canManage:true});
 assert.match(text(tree),/Birth Services Information Desk/);assert.equal(nodes(tree,'TabsTrigger').length,2);
 assert.deepEqual(nodes(tree,'InformationAccordion')[0].props.items,[faq]);
 nodes(tree,'Button')[0].props.onClick();nodes(tree,'InformationAccordion')[0].props.onEdit(entry);
 assert.deepEqual(routes,['/birth-services/information-desk/manage','/birth-services/information-desk/manage?id=entry-1']);
 tree=View({information:[entry],canManage:false});assert.match(text(tree),/Visa Information Desk/);assert.equal(nodes(tree,'Button').length,0);
});

test('birth form validates and saves structured FAQs to its own resource',async()=>{
 const c=formControl();await c.save();assert.equal(c.calls.length,0);assert.match(text(c.render()),/Title is required/);
 c.edit('title','Current Birth Services FAQ');c.edit('country','Example country');
 const field=nodes(c.render(),'Input').find(n=>n.props.placeholder==='e.g. How long is the processing time?');field.props.onChange({target:{value:'Where is the current guidance?'}});
 nodes(c.render(),'RichEditor')[0].props.onChange('<p>Use the approved guidance.</p>');
 await c.save();assert.equal(c.calls[0][1],'birth-services');assert.equal(c.calls[0][2].title,'Current Birth Services FAQ');
 assert.deepEqual(JSON.parse(c.calls[0][2].content),{type:'faq',faqs:[{question:'Where is the current guidance?',answer:'<p>Use the approved guidance.</p>'}]});
 assert.deepEqual(c.routes,['/birth-services/information-desk','refresh']);
});

test('saved FAQ and office content is available on first render and updates the correct desk',async()=>{
 const faq={...entry,category:'FAQ',content:JSON.stringify({type:'faq',faqs:[{question:'Where is the reference?',answer:'<p>Approved <strong>reference</strong>.</p>'}]})};
 const c=formControl({record:faq});assert.equal(nodes(c.render(),'RichEditor')[0].props.value,'<p>Approved <strong>reference</strong>.</p>');assert.equal(c.calls.length,0);
 await c.save();assert.equal(c.calls[0][0],'update');assert.equal(c.calls[0][1],'birth-services');assert.equal(c.calls[0][2],'entry-1');
 const locations={...entry,category:'Submission Info',content:JSON.stringify({type:'locations',locations:[{name:'Example office',address:'Example address',timings:'By appointment'}],notes:'<p>Contact the officer</p>'})};
 const v=formControl({record:locations,desk:'visa'});assert.ok(nodes(v.render(),'Input').some(n=>n.props.value==='Example office'));await v.save();assert.equal(v.calls[0][1],'visa');assert.equal(v.routes[0],'/visa/information-desk');
});

test('failed saves keep the entered information and legacy visa text is preserved during editing',async()=>{
 const c=formControl({record:entry,result:{success:false,error:'Could not save'}});c.edit('title','Keep my edit');await c.save();assert.equal(c.routes.length,0);assert.ok(nodes(c.render(),'Input').some(n=>n.props.value==='Keep my edit'));assert.match(text(c.render()),/Could not save/);
 const {initialInformationContent}=actionLoader().load('lib/information-desk.ts');
 assert.deepEqual(initialInformationContent({...entry,content:'Legacy reference\nKeep this text'}).checklist,['Legacy reference\nKeep this text']);
});

test('staff cannot see edit/delete controls; birth deletion uses the birth action',async()=>{
 const calls=[];
 const Accordion=actionLoader(undefined,{...common,react:{useState:()=>[null,()=>{}]},'next/navigation':{useRouter:()=>({refresh(){calls.push(['refresh']);}})},'@/lib/api/information-desk':{deleteInformationEntry:async(...args)=>{calls.push(args);return{success:true};}},sonner:{toast:{success(){},error(){}}}}).load('components/information-desk/information-accordion.tsx').InformationAccordion;
 assert.equal(nodes(Accordion({desk:'birth-services',items:[entry],canManage:false,onEdit(){}}),'Button').length,0);
 const manager=Accordion({desk:'birth-services',items:[entry],canManage:true,onEdit(){}});await nodes(manager,'AlertDialogAction')[0].props.onClick();
 assert.deepEqual(calls[0],['birth-services','entry-1']);
});

test('server actions select isolated endpoints, revalidate both views and preserve failures',async()=>{
 const calls=[],refreshes=[];
 const api=actionLoader(async(method,path,body)=>{calls.push([method,path,body]);return{success:true,data:method==='delete'?{success:true}:method==='get'?[entry]:entry};},{'next/cache':{revalidatePath:path=>refreshes.push(path)}}).load('lib/api/information-desk.ts');
 await api.getInformationDeskEntries('birth-services',{country:'Example country'});await api.createInformationEntry('birth-services',entry);await api.updateInformationEntry('birth-services','entry-1',{title:'Updated'});await api.deleteInformationEntry('birth-services','entry-1');await api.createInformationEntry('visa',entry);await api.createBirthServicesFile(new FormData());await api.updateBirthServicesFile('entry-1',new FormData());
 assert.match(calls[0][1],/^\/api\/birth-services-information\?country=/);assert.equal(calls[1][1],'/api/birth-services-information');assert.equal(calls[3][1],'/api/birth-services-information/entry-1');assert.equal(calls[4][1],'/api/visa-information');
 assert.ok(refreshes.includes('/my/birth-services'));assert.ok(refreshes.includes('/birth-services/information-desk'));assert.ok(refreshes.includes('/my/visa'));
 assert.equal(calls[5][1],'/api/birth-services-information/files');assert.equal(calls[6][1],'/api/birth-services-information/entry-1/file');
 const before=calls.length;assert.equal((await api.createInformationEntry('../admin',entry)).success,false);assert.equal(calls.length,before);
});

test('birth services staff page loads content on the server and keeps management controls off',async()=>{
 const calls=[];
 const Page=actionLoader(undefined,{'react/jsx-runtime':jsxRuntime,'@/lib/api/information-desk':{getInformationDeskEntries:async desk=>{calls.push(desk);return[entry];}},'@/components/information-desk/information-desk-view':names('InformationDeskView')}).load('app/(admin)/my/birth-services/page.tsx').default;
 const tree=await Page();const view=nodes(tree,'InformationDeskView')[0];assert.deepEqual(calls,['birth-services']);assert.equal(view.props.canManage,false);assert.equal(view.props.desk,'birth-services');assert.deepEqual(view.props.information,[entry]);
});

test('only birth-services and super see its department navigation; all staff have its personal read view',()=>{
 const {getNavigationForUser}=actionLoader(undefined,{'lucide-react':new Proxy({},{get:(_,key)=>String(key)})}).load('lib/navigation.ts');
 const officer=getNavigationForUser({role:'account',secondary_roles:['birth-services']});assert.ok(officer.department.some(n=>n.url==='/birth-services/information-desk'));
 const visa=getNavigationForUser({role:'visa'});assert.ok(!visa.department.some(n=>n.url==='/birth-services/information-desk'));assert.ok(visa.personal.flatMap(n=>n.items??[]).some(n=>n.url==='/my/birth-services'));
 assert.ok(getNavigationForUser({role:'super'}).department.some(n=>n.url==='/birth-services/information-desk'));
 assert.ok(!getNavigationForUser({role:'mp'}).department.some(n=>n.url.startsWith('/birth-services/')));
});

test('birth management page checks the role before loading an edit record',async()=>{
 let reads=0;
 const denied=actionLoader(undefined,{...common,'@/lib/auth/session':{getCurrentUser:async()=>({role:'visa'})},'@/lib/api/information-desk':{getInformationDeskEntry:async()=>{reads++;return entry;}},'@/components/information-desk/manage-info-form':names('ManageInfoForm')}).load('app/(admin)/birth-services/information-desk/manage/page.tsx').default;
 await assert.rejects(()=>denied({searchParams:Promise.resolve({id:'entry-1'})}),error=>error.digest?.startsWith('NEXT_REDIRECT'));
 assert.equal(reads,0);
 const allowed=actionLoader(undefined,{...common,'@/lib/auth/session':{getCurrentUser:async()=>({role:'account',secondary_roles:['birth-services']})},'@/lib/api/information-desk':{getInformationDeskEntry:async(desk,id)=>{assert.equal(desk,'birth-services');assert.equal(id,'entry-1');return entry;}},'@/components/information-desk/manage-info-form':names('ManageInfoForm')}).load('app/(admin)/birth-services/information-desk/manage/page.tsx').default;
 const tree=await allowed({searchParams:Promise.resolve({id:'entry-1'})});assert.equal(tree.props.infoRecord,entry);assert.equal(tree.props.desk,'birth-services');
});
