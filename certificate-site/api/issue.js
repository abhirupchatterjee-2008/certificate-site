const crypto = require("crypto");
module.exports = async (req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  const secret=process.env.CERT_SIGNING_SECRET;
  if(!secret) return res.status(503).json({error:"CERT_SIGNING_SECRET is not configured"});
  try{
    const {certificates=[],event="LC MUN",edition=""}=req.body||{};
    if(!Array.isArray(certificates)||certificates.length>500) return res.status(400).json({error:"Invalid certificate batch"});
    const issuedAt=new Date().toISOString();
    const out=certificates.map((c,i)=>{
      const id=String(c.id||"").trim();
      const payload={id,name:String(c.name||""),committee:String(c.committee||""),portfolio:String(c.portfolio||""),event:String(event),edition:String(edition),issuedAt};
      const body=Buffer.from(JSON.stringify(payload)).toString("base64url");
      const sig=crypto.createHmac("sha256",secret).update(body).digest("base64url");
      return {...payload,token:body+"."+sig};
    });
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({certificates:out});
  }catch(e){return res.status(500).json({error:"Issue operation failed"})}
};