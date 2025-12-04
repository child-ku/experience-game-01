<template>
  <div id="app">
    <h1>Web 网页截图工具</h1>
    <div class="input-section">
      <input type="text" v-model="url" placeholder="请输入网页 URL" />
      <button @click="captureScreenshot">截图</button>
    </div>
    <div class="options-section">
      <h2>截图选项</h2>
      <label>
        <input type="radio" v-model="screenshotType" value="full" /> 
        整页滚动截图
      </label>
      <label>
        <input type="radio" v-model="screenshotType" value="visible" /> 
        可视区域截图
      </label>
      <label>
        <input type="radio" v-model="screenshotType" value="custom" /> 
        自定义区域截图
      </label>
    </div>
    <div class="iframe-container" v-if="url">
      <iframe ref="iframe" :src="url" @load="iframeLoaded"></iframe>
    </div>
    <div class="result-section" v-if="screenshotData">
      <h2>截图结果</h2>
      <img :src="screenshotData" alt="网页截图" />
      <button @click="downloadScreenshot">下载截图</button>
    </div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';

export default {
  name: 'App',
  data() {
    return {
      url: '',
      screenshotType: 'full',
      screenshotData: null,
      iframeLoaded: false
    }
  },
  methods: {
    async captureScreenshot() {
      if (!this.url) {
        alert('请输入网页 URL');
        return;
      }

      // 自动为 URL 添加 http:// 或 https:// 前缀
      if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
        this.url = 'https://' + this.url;
      }

      // 等待 iframe 加载完成
      await this.waitForIframeLoad();

      try {
        const iframe = this.$refs.iframe;
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        const iframeBody = iframeDocument.body;

        // 使用 html2canvas 截图
        const canvas = await html2canvas(iframeBody, {
          scale: 2, // 提高截图质量
          useCORS: true, // 允许跨域截图
          logging: false // 关闭日志
        });

        // 将 canvas 转换为 base64 编码的图片数据
        this.screenshotData = canvas.toDataURL('image/png');
      } catch (error) {
        console.error('截图失败:', error);
        alert('截图失败，请检查网页 URL 是否正确或是否存在跨域问题');
      }
    },
    async waitForIframeLoad() {
      return new Promise((resolve) => {
        const iframe = this.$refs.iframe;
        if (iframe) {
          iframe.onload = () => {
            resolve();
          };
        } else {
          resolve();
        }
      });
    },
    iframeLoaded() {
      this.iframeLoaded = true;
      console.log('网页加载完成');
    },
    downloadScreenshot() {
      if (!this.screenshotData) {
        alert('没有可下载的截图');
        return;
      }

      const link = document.createElement('a');
      link.href = this.screenshotData;
      link.download = '网页截图.png';
      link.click();
    }
  }
}
</script>

<style>
#app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.input-section {
  margin-bottom: 20px;
}

.input-section input {
  width: 70%;
  padding: 10px;
  font-size: 16px;
}

.input-section button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

.options-section {
  margin-bottom: 20px;
}

.options-section h2 {
  margin-bottom: 10px;
}

.options-section label {
  display: block;
  margin-bottom: 5px;
}

.result-section {
  margin-top: 20px;
}

.result-section h2 {
  margin-bottom: 10px;
}

.result-section img {
  max-width: 100%;
  height: auto;
  margin-bottom: 10px;
}

.iframe-container {
  margin-top: 20px;
  margin-bottom: 20px;
  height: 500px;
  border: 1px solid #ccc;
  overflow: hidden;
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.result-section button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  cursor: pointer;
}
</style>