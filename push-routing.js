(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KifPushRouting=api;})(typeof self==='object'?self:globalThis,function(){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 function valid(data){return data&&['post','message','test'].includes(data.kind)&&uuid.test(data.source_id||'');}
 function build(data,base){const url=new URL(base);url.search='';url.hash='';if(valid(data)){url.searchParams.set('push_kind',data.kind);url.searchParams.set('push_source',data.source_id);}return url.href;}
 function parse(value,base){try{const u=new URL(value,base),b=new URL(base);if(u.origin!==b.origin||![b.pathname,b.pathname+'index.html'].includes(u.pathname))return null;const data={kind:u.searchParams.get('push_kind'),source_id:u.searchParams.get('push_source')};return valid(data)?data:null;}catch{return null;}}
 return {valid,build,parse};
});
