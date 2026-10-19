import test from 'node:test';
import assert from 'node:assert/strict';
import * as jsxRuntime from 'react/jsx-runtime';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const {summarizeAttendanceCharts, attendanceChartPeriod} = actionLoader(() => {}).load('lib/utils/attendance-charts.ts');
const row = (id, user_id, time, department, extra={}) => ({id,user_id,clock_in_at:time,user:{department},...extra});
const records = [
  row(1,'a','2026-10-15T09:05:59+01:00','Accounts'),
  row(2,'a','2026-10-15T10:00:00+01:00','Accounts'),
  row(3,'b','2026-10-15T09:06:00+01:00','Accounts'),
  row(4,'c','2026-10-15T10:00:00+01:00','IT',{is_late_permitted:true}),
  row(5,'d','2026-10-15T23:30:00Z',null),
  row(6,'x','invalid','IT'),
];
test('daily series uses first arrival per Lagos day and separates permitted late without counting duplicate records', () => {
  const data = summarizeAttendanceCharts([...records].reverse(),'2026-10-14','2026-10-16');
  assert.deepEqual(data.days,[{date:'2026-10-14',early:0,late:0,permitted:0},{date:'2026-10-15',early:1,late:1,permitted:1},{date:'2026-10-16',early:1,late:0,permitted:0}]);
  assert.deepEqual(data.departments.find(d=>d.department==='Accounts'),{department:'Accounts',early:1,arrivals:2,rate:50});
  assert.equal(data.departments.find(d=>d.department==='IT').rate,0);
  assert.equal(data.departments.find(d=>d.department==='Unassigned').rate,100);
  assert.equal(data.departments.reduce((sum,d)=>sum+d.arrivals,0),4);
  assert.equal(summarizeAttendanceCharts(records,'2026-10-16','2026-10-16').departments.length,1);
});
test('default period is 30 calendar days and explicit boundaries are preserved', () => {
  assert.deepEqual(attendanceChartPeriod(undefined,undefined,'2026-10-16'),{from:'2026-09-17',to:'2026-10-16'});
  assert.deepEqual(attendanceChartPeriod(undefined,'2027-01-05','2027-01-10'),{from:'2026-12-07',to:'2027-01-05'});
  assert.deepEqual(attendanceChartPeriod('2026-10-01','2026-10-03','2026-10-16'),{from:'2026-10-01',to:'2026-10-03'});
  assert.deepEqual(summarizeAttendanceCharts([],'2026-10-01','2026-10-03').departments,[]);
});
test('a failed later API page rejects the entire list instead of returning misleading partial totals', async () => {
  const loader = actionLoader(async (_method,url) => url.includes('page=1&') ? {success:true,data:{data:{data:[records[0]],meta:{last_page:2}}}} : {success:false,error:{error:'Failed'}});
  await assert.rejects(loader.load('lib/api/clock-in.ts').getAllClockInsForFilters('2026-10-01','2026-10-16'), /all attendance records/);
});
function pageFixture(fail=false) {
  const calls=[];
  const loader = actionLoader(() => {}, {
    'react/jsx-runtime':jsxRuntime,
    './components/attendance-client': {AttendanceClient:'AttendanceClient'},
    '@/lib/api/employees':{getEmployees:async()=>({items:[]})},
    '@/lib/api/clock-in':{getAllClockInsForFilters:async(...args)=>{calls.push(args);if(fail)throw new Error('Unavailable');return records;},getAllClockInStats:async()=>({success:false})},
  });
  return {run:loader.load('app/(admin)/attendance/page.tsx').default,calls};
}
test('page reuses history for matching chart dates, preserves staff/late-clock-out filters, and exposes load failures', async () => {
  const fixture=pageFixture();
  const result=await fixture.run({searchParams:Promise.resolve({from:'2026-10-14',to:'2026-10-16',user_id:'a',clock_out:'late'})});
  assert.equal(fixture.calls.length,1);
  assert.deepEqual(fixture.calls[0],['2026-10-14','2026-10-16','a',100,true]);
  assert.equal(result.props.charts.days.length,3);
  const failed=pageFixture(true);
  const error=await failed.run({searchParams:Promise.resolve({from:'2026-10-14',to:'2026-10-16'})});
  assert.equal(error.props.historyFailed,true);
  assert.equal(error.props.charts,null);
});

test('default page shares the same thirty-day scope between totals, records and charts', async () => {
  const fixture=pageFixture();
  const result=await fixture.run({searchParams:Promise.resolve({})});
  assert.equal(fixture.calls.length,1);
  assert.equal(result.props.initialFrom,result.props.charts.from);
  assert.equal(result.props.initialTo,result.props.charts.to);
  assert.equal(result.props.charts.days.length,30);
  assert.deepEqual(fixture.calls[0].slice(0,2),[result.props.initialFrom,result.props.initialTo]);
});
