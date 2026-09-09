export function inquiryPayload(values, accessKey) {
  const { website_check, ...fields } = values;
  return {
    ...fields,
    access_key: accessKey,
    subject: `Video Brochure Plus — ${fields.RequestType || 'Quote request'}`,
    from_name: 'Video Brochure Plus Website',
    botcheck: ''
  };
}

export async function sendInquiry(payload, transport = fetch, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await transport('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok || data.success !== true) throw new Error('Submission was not confirmed');
    return data;
  } finally {
    clearTimeout(timer);
  }
}
