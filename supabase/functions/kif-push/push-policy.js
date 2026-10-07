// Shared with Node behavioral tests and the Deno edge runtime.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KifPushPolicy=api;})(globalThis,function(){
 function validEndpoint(value){try{const u=new URL(value);return typeof value==='string'&&value.length<=2048&&u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&/^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.apple\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/.test(u.hostname)&&u.pathname.length>1;}catch{return false;}}
 function outcome(status){return status>=200&&status<300?'sent':status===404||status===410?'expired':status===429||status>=500?'retry':'failed';}
 function retrySeconds(attempt){return [60,300,1800][attempt-1]??null;}
 function payload(data){return {id:data.id,kind:data.kind,source_id:data.source_id,title:data.kind==='test'?'Testnotis från KIF':data.kind==='post'?'Nytt laginlägg i KIF':'Nytt meddelande i KIF',body:data.kind==='test'?'Notiser fungerar på den här enheten.':'Öppna KIF för att läsa.',unread_count:Number.isSafeInteger(data.unread_count)&&data.unread_count>=0?data.unread_count:0};}
 function authorizeWorker(header,secret){return typeof secret==='string'&&secret.length>0&&header==='Bearer '+secret;}
 return {authorizeWorker,validEndpoint,outcome,retrySeconds,payload};
});
