import {getAuthToken} from "@/lib/auth/session";

export async function GET(_request:Request,{params}:{params:Promise<{candidateId:string}>}) {
  const token=await getAuthToken();
  if(!token)return new Response("Unauthenticated",{status:401});
  const {candidateId}=await params;
  if(!/^[a-zA-Z0-9-]+$/.test(candidateId))return new Response("Invalid applicant",{status:400});
  const base=process.env.API_URL||process.env.NEXT_PUBLIC_API_URL||(process.env.NODE_ENV==="production"?"https://api.aspomportal.com":"http://localhost:8000");
  const response=await fetch(`${base}/api/recruitment/candidates/${candidateId}/cv`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  if(!response.ok)return new Response("The CV could not be downloaded.",{status:response.status});
  return new Response(response.body,{headers:{"Content-Type":response.headers.get("content-type")||"application/octet-stream","Content-Disposition":response.headers.get("content-disposition")||"attachment", "Cache-Control":"private, no-store"}});
}
