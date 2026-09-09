import assert from 'node:assert/strict';
import { inquiryPayload, sendInquiry } from '../forms-core.mjs';

const form = { Name:'Test', Email:'test@example.invalid', RequestType:'Sample request', Product:'Video folders', website_check:'' };
const payload = inquiryPayload(form,'test-key');
assert.equal(payload.access_key,'test-key');
assert.equal(payload.Email,form.Email);
assert.ok(!('website_check' in payload));
await sendInquiry(payload, async (url,init) => {
  assert.equal(url,'https://api.web3forms.com/submit');
  assert.equal(init.method,'POST');
  return { ok:true, json:async()=>({success:true}) };
});
for (const response of [
  {ok:false,json:async()=>({success:true})},
  {ok:true,json:async()=>({success:false})},
  {ok:true,json:async()=>{throw new SyntaxError('not json')}}
]) await assert.rejects(sendInquiry(payload,async()=>response));
await assert.rejects(sendInquiry(payload,async()=>{throw new TypeError('offline')}));
await assert.rejects(sendInquiry(payload,async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true})),10));
console.log('Validated form payload, success, HTTP error, service rejection, malformed response, offline and timeout behavior.');
