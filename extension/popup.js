document.addEventListener("DOMContentLoaded", async () => {
  const serverUrlInput = document.getElementById("serverUrl");
  const caseIdInput = document.getElementById("caseId");
  const tabTitleEl = document.getElementById("tabTitle");
  const clipBtn = document.getElementById("clipBtn");
  const statusEl = document.getElementById("status");

  // Load saved preferences
  chrome.storage.local.get(["serverUrl", "caseId"], (res) => {
    if (res.serverUrl) serverUrlInput.value = res.serverUrl;
    if (res.caseId) caseIdInput.value = res.caseId;
  });

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    tabTitleEl.textContent = tab.title || tab.url || "صفحة غير معروفة";
  }

  clipBtn.addEventListener("click", async () => {
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");
    const caseId = caseIdInput.value.trim();

    if (!caseId) {
      statusEl.className = "status error";
      statusEl.textContent = "يرجى إدخال معرّف القرار (Case ID)";
      return;
    }

    // Save for next time
    chrome.storage.local.set({ serverUrl, caseId });

    statusEl.className = "status loading";
    statusEl.textContent = "جارٍ استخراج البيانات من الصفحة...";
    clipBtn.disabled = true;

    try {
      // Execute extraction script in the active tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let nextData = "";
          if (window.__NEXT_DATA__?.props?.pageProps) {
            try {
              nextData = "[بيانات المنصة]: " + JSON.stringify(window.__NEXT_DATA__.props.pageProps) + "\n\n";
            } catch (e) {}
          }
          const text = (document.body.innerText || "").slice(0, 40000);
          return {
            url: window.location.href,
            title: document.title,
            text: nextData + text,
          };
        },
      });

      const extracted = results?.[0]?.result;
      if (!extracted || !extracted.text) {
        throw new Error("تعذر قراءة محتوى الصفحة.");
      }

      statusEl.textContent = "جارٍ الإرسال إلى بوصلة العقار والتحليل بالذكاء الاصطناعي...";

      const res = await fetch(`${serverUrl}/api/clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          source_url: extracted.url,
          title: extracted.title,
          text: extracted.text,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        statusEl.className = "status success";
        statusEl.textContent = "✓ تم استيراد العقار وتحليله بنجاح!";
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        throw new Error(data.error || "فشل الاستيراد");
      }
    } catch (err) {
      statusEl.className = "status error";
      statusEl.textContent = "خطأ: " + (err.message || "فشلت العملية");
      clipBtn.disabled = false;
    }
  });
});
