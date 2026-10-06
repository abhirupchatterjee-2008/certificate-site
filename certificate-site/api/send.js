module.exports=async(req,res)=>{
 if(req.method!=="POST") return res.status(405).json({error:"POST only"});
 const key=process.env.RESEND_API_KEY,from=process.env.MAIL_FROM;
 if(!key||!from) return res.status(503).json({error:"RESEND_API_KEY and MAIL_FROM must be configured"});
 try{
  const {jobs=[],subject="Your LC MUN Certificate",html}=req.body||{};
  if(!Array.isArray(jobs)||jobs.length>200) return res.status(400).json({error:"Invalid delivery batch"});
  if(!html) return res.status(400).json({error:"Email body is required"});
  const results=[];
  for(const job of jobs){
   if(!job.email) continue;
   const payload={from,to:from,bcc:[job.email],subject,html};
   if(job.attachment) payload.attachments=[job.attachment];
   const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await r.json();
   results.push({email:job.email,ok:r.ok,id:data.id||null,error:r.ok?null:(data.message||"Email failed")});
  }
  return res.status(200).json({results});
 }catch(e){return res.status(500).json({error:"Email delivery failed"})}
};