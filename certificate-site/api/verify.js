const crypto=require("crypto");
module.exports=async(req,res)=>{
  const token=String(req.query.token||"");
  const secret=process.env.CERT_SIGNING_SECRET;
  if(!secret||!token.includes(".")) return res.status(400).json({valid:false,error:"Invalid verification token"});
  const [body,sig]=token.split(".");
  const expected=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  const ok=sig.length===expected.length && crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));
  if(!ok) return res.status(200).json({valid:false});
  try{
    const payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    return res.status(200).json({valid:true,certificate:payload});
  }catch(e){return res.status(200).json({valid:false})}
};