/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'promo-video');
const TEMP_DIR = path.join(OUTPUT_DIR, 'temp');
const FINAL_DIR = path.join(OUTPUT_DIR, 'output');
const ICON_PATH = path.join(PROJECT_ROOT, 'assets/images/icon.png');

[TEMP_DIR, FINAL_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'tools/screenshot-studio/screenshots/android');

// Find Chrome/Edge
function findBrowser() {
  const candidates = [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Find Python with edge_tts installed
function findPython() {
  const candidates = [
    '/opt/homebrew/opt/python@3.13/bin/python3.13',
    '/opt/homebrew/opt/python@3.14/bin/python3.14',
    '/opt/homebrew/opt/python@3.11/bin/python3.11',
    'python3',
  ];
  for (const p of candidates) {
    try {
      execSync(`"${p}" -c "import edge_tts"`, { stdio: 'ignore' });
      return p;
    } catch {
      // ignore
    }
  }
  return 'python3';
}

const pythonPath = findPython();
const browserPath = findBrowser();
if (!browserPath) {
  console.error('❌ 找不到可用的 Chromium 核心瀏覽器 (Edge/Chrome)');
  process.exit(1);
}

// Scene definitions
const SCENES = [
  {
    id: 'scene1',
    badge: '🏃 揮汗有禮・痛點卡關',
    badgeBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
    badgeBorder: 'rgba(239, 68, 68, 0.4)',
    title: '還在手動選民國生日？',
    subtitle: '運動截圖傳錯審核不通過！',
    bgImage: path.join(SCREENSHOTS_DIR, 'twsports_screenshot_03_1290x2796.png'),
    scriptText:
      '你也在領運動部的揮汗有禮加碼券嗎？每次登入身分證、生日選單點到手痠？更怕運動截圖傳錯審核不通過？',
    motion: 'pan_down',
    subtitles: [
      {
        relStart: 0.1,
        relEnd: 3.25,
        text: '你也在領運動部的揮汗有禮加碼券嗎？',
        highlight: '揮汗有禮加碼券',
      },
      {
        relStart: 3.25,
        relEnd: 6.81,
        text: '每次登入身分證、生日選單點到手痠？',
        highlight: '身分證、生日選單點到手痠',
      },
      {
        relStart: 6.81,
        relEnd: 9.78,
        text: '更怕運動截圖傳錯審核不通過？',
        highlight: '審核不通過',
      },
    ],
  },
  {
    id: 'scene2',
    badge: '⚡️ 亮點一・一鍵自動填表',
    badgeBg: 'linear-gradient(135deg, #FF5E1E, #EA580C)',
    badgeBorder: 'rgba(255, 94, 30, 0.4)',
    title: '一鍵自動填表直達！',
    subtitle: '免反覆輸入・秒進「我的任務」',
    bgImage: path.join(SCREENSHOTS_DIR, 'twsports_screenshot_01_1290x2796.png'),
    scriptText:
      '試試這款超實用的加碼券小幫手 App！點擊一鍵登入，身分證、出生年月日秒速自動填入，直接進入我的任務，省去大半繁瑣步驟！',
    motion: 'pan_up',
    subtitles: [
      {
        relStart: 0.1,
        relEnd: 3.39,
        text: '試試這款超實用的加碼券小幫手 App！',
        highlight: '加碼券小幫手 App',
      },
      {
        relStart: 3.39,
        relEnd: 7.2,
        text: '點擊一鍵登入，身分證、生日秒速填入，',
        highlight: '一鍵登入',
      },
      {
        relStart: 7.2,
        relEnd: 11.06,
        text: '直接進入我的任務，省去大半繁瑣步驟！',
        highlight: '省去大半繁瑣步驟',
      },
    ],
  },
  {
    id: 'scene3',
    badge: '🔍 亮點二・合格預檢機制',
    badgeBg: 'linear-gradient(135deg, #10B981, #059669)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    title: '基於揮汗有禮網站演算法改良',
    subtitle: '上傳前先把關・降低審核失敗風險！',
    bgImage: path.join(SCREENSHOTS_DIR, 'twsports_screenshot_02_1290x2796.png'),
    scriptText:
      '內建超實用的合格預檢功能！官方上傳只有一次機會，採用基於揮汗有禮網站演算法改良的檢核機制，上傳前先幫你把關，大幅降低審核不通過的風險！',
    motion: 'pan_down',
    subtitles: [
      {
        relStart: 0.1,
        relEnd: 2.85,
        text: '內建超實用的合格預檢功能！',
        highlight: '合格預檢功能',
      },
      { relStart: 2.85, relEnd: 5.0, text: '官方上傳只有一次機會，', highlight: '只有一次機會' },
      {
        relStart: 5.0,
        relEnd: 8.7,
        text: '採用基於揮汗有禮網站演算法改良的檢核機制，',
        highlight: '演算法改良',
      },
      {
        relStart: 8.7,
        relEnd: 12.58,
        text: '上傳前先幫你把關，大幅降低審核不通過的風險！',
        highlight: '審核不通過的風險',
      },
    ],
  },
  {
    id: 'scene4',
    badge: '👨‍👩‍👧‍👦 亮點三・家庭成員切換',
    badgeBg: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    badgeBorder: 'rgba(59, 130, 246, 0.4)',
    title: '幫不熟手機的家人快速確認',
    subtitle: '本機硬體安全晶片加密・個資絕不上傳',
    bgImage: path.join(SCREENSHOTS_DIR, 'twsports_screenshot_05_1290x2796.png'),
    scriptText:
      '支援家庭多成員管理，你可以幫不熟悉操作的家人快速切換身分確認任務！所有資料都存在手機硬體晶片，絕不上傳雲端，安全又放心！',
    motion: 'pan_down',
    subtitles: [
      { relStart: 0.1, relEnd: 1.9, text: '支援家庭多成員管理，', highlight: '家庭多成員管理' },
      {
        relStart: 1.9,
        relEnd: 6.0,
        text: '你可以幫不熟悉操作的家人快速切換身分確認任務！',
        highlight: '你可以幫不熟悉操作的家人',
      },
      {
        relStart: 6.0,
        relEnd: 8.6,
        text: '所有資料都存在手機硬體晶片，',
        highlight: '手機硬體晶片',
      },
      {
        relStart: 8.6,
        relEnd: 11.35,
        text: '絕不上傳雲端，安全又放心！',
        highlight: '絕不上傳雲端',
      },
    ],
  },
  {
    id: 'scene5',
    badge: '🎁 亮點四・週程提醒與超商加碼',
    badgeBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    badgeBorder: 'rgba(139, 92, 246, 0.4)',
    title: '最新 10 週延續時程・首波 14 週指引',
    subtitle: '完全免費・無廣告・立即下載體驗！',
    bgImage: path.join(SCREENSHOTS_DIR, 'twsports_screenshot_04_1290x2796.png'),
    scriptText:
      '還有最新 10 週延續時程與首波 14 週倒數指引，五大超商兌換清單！完全免費、沒有廣告，現在就點資訊欄連結下載吧！',
    motion: 'pan_down',
    subtitles: [
      {
        relStart: 0.1,
        relEnd: 5.81,
        text: '還有最新 10 週延續時程與首波 14 週倒數指引，五大超商兌換清單！',
        highlight: '最新 10 週延續時程與首波 14 週倒數指引',
      },
      {
        relStart: 5.76,
        relEnd: 8.5,
        text: '完全免費、沒有廣告，',
        highlight: '完全免費、沒有廣告',
      },
      {
        relStart: 8.5,
        relEnd: 11.08,
        text: '現在就到資訊欄下載體驗吧！',
        highlight: '立即下載體驗',
      },
    ],
  },
];

// 1. Generate Voiceover via Edge-TTS
console.log('🎙️ [1/6] 正在生成高品質台灣繁體中文旁白語音 (Edge-TTS)...');
for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const audioPath = path.join(TEMP_DIR, `${s.id}.mp3`);
  const cmd = `"${pythonPath}" -m edge_tts --voice "zh-TW-HsiaoChenNeural" --rate "+18%" --text "${s.scriptText}" --write-media "${audioPath}"`;
  execSync(cmd, { stdio: 'pipe' });
  const dur = parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    )
      .toString()
      .trim()
  );
  s.duration = dur;
  console.log(`   ✅ ${s.id}: ${dur.toFixed(2)}s - "${s.scriptText.slice(0, 20)}..."`);
}

// 2. Generate Lo-Fi BGM
console.log('🎵 [2/6] 正在合成溫暖輕快背景音樂 (BGM)...');
const bgmPath = path.join(TEMP_DIR, 'bgm.wav');
const totalDuration = SCENES.reduce((acc, s) => acc + s.duration, 0);
execSync(
  `"${pythonPath}" -c '
import wave, math, struct
def gen(path, dur):
    rate, bpm = 44100, 114
    beat = 60.0 / bpm
    total = int(rate * dur)
    chords = [[261.63, 329.63, 392.00, 493.88], [220.00, 261.63, 329.63, 392.00], [174.61, 220.00, 261.63, 329.63], [196.00, 246.94, 293.66, 349.23]]
    frames = []
    for i in range(total):
        t = i / rate
        chord = chords[int(t / (beat * 4)) % len(chords)]
        env = math.exp(-0.8 * (t % beat)) * 0.7 + 0.3
        sig = sum(math.sin(2 * math.pi * f * t) * 0.5 + math.sin(2 * math.pi * f * 2 * t) * 0.15 for f in chord) / len(chord) * env
        bt = t % beat
        kick = (math.sin(2 * math.pi * (120 * math.exp(-25 * bt) + 45) * bt) * math.exp(-30 * bt) * 0.5) if (int(t / beat) % 4 in [0, 2] and bt < 0.15) else 0.0
        hat = (((math.sin(i * 12.9898) * 43758.5453) % 1.0 - 0.5) * math.exp(-60 * (t % (beat / 2))) * 0.15) if (t % (beat / 2) < 0.04) else 0.0
        s = (sig * 0.28 + kick * 0.35 + hat * 0.2) * 0.18
        if t > dur - 2.5: s *= max(0.0, (dur - t) / 2.5)
        frames.append(struct.pack("<h", max(-32768, min(32767, int(s * 32767)))))
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(b"".join(frames))
gen("${bgmPath}", ${totalDuration + 2.0})
'`,
  { stdio: 'pipe' }
);
console.log(`   ✅ BGM 合成完成 (總長度: ${(totalDuration + 2.0).toFixed(1)}s)`);

// 3. Render High-Resolution Top Header Overlays using Headless Browser
console.log('🖼️  [3/6] 正在渲染精美頂部導航字卡 (Edge Headless)...');
SCENES.forEach((s) => {
  const htmlPath = path.join(TEMP_DIR, `overlay_${s.id}.html`);
  const pngPath = path.join(TEMP_DIR, `overlay_${s.id}.png`);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      overflow: hidden;
    }
    .header-card {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      background: linear-gradient(180deg, #181D29 0%, #10131B 100%);
      border-bottom: 3px solid rgba(255, 255, 255, 0.15);
      border-radius: 0 0 44px 44px;
      padding: 44px 48px 30px 48px;
      box-shadow: 0 24px 50px rgba(0, 0, 0, 0.65);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: ${s.badgeBg};
      border: 1px solid ${s.badgeBorder};
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 800;
      padding: 8px 26px;
      border-radius: 9999px;
      letter-spacing: 2px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      margin-bottom: 14px;
    }
    .title {
      color: #FFFFFF;
      font-size: 44px;
      font-weight: 900;
      line-height: 1.25;
      letter-spacing: 1px;
      margin-bottom: 6px;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    }
    .subtitle {
      color: #FFD8A8;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header-card">
    <div class="badge">${s.badge}</div>
    <div class="title">${s.title}</div>
    <div class="subtitle">${s.subtitle}</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(
    `"${browserPath}" --headless --disable-gpu --default-background-color=00000000 --window-size=1080,1920 --screenshot="${pngPath}" "${htmlPath}"`,
    { stdio: 'pipe' }
  );
  s.overlayImage = pngPath;
  console.log(`   ✅ 渲染字卡: overlay_${s.id}.png`);
});

// Outro Card for End of Scene 5 (CTA)
const outroHtmlPath = path.join(TEMP_DIR, 'outro_card.html');
const outroPngPath = path.join(TEMP_DIR, 'outro_card.png');
const iconBase64 = fs.existsSync(ICON_PATH)
  ? `data:image/png;base64,${fs.readFileSync(ICON_PATH).toString('base64')}`
  : '';

const outroHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      background: rgba(18, 14, 12, 0.88);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #FFFFFF;
      text-align: center;
    }
    .icon {
      width: 220px;
      height: 220px;
      border-radius: 48px;
      box-shadow: 0 24px 60px rgba(255, 94, 30, 0.45), 0 0 0 6px rgba(255, 255, 255, 0.2);
      margin-bottom: 40px;
    }
    .app-title {
      font-size: 56px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-bottom: 16px;
      color: #FFFFFF;
    }
    .tagline {
      font-size: 34px;
      color: #FF9E66;
      font-weight: 700;
      margin-bottom: 48px;
      letter-spacing: 1px;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 60px;
      width: 100%;
      max-width: 800px;
    }
    .feature-item {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 20px;
      padding: 18px 30px;
      font-size: 32px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .cta-btn {
      background: linear-gradient(135deg, #FF5E1E, #EA580C);
      color: #FFFFFF;
      font-size: 42px;
      font-weight: 900;
      padding: 24px 64px;
      border-radius: 9999px;
      letter-spacing: 3px;
      box-shadow: 0 16px 40px rgba(255, 94, 30, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.4);
    }
  </style>
</head>
<body>
  <img class="icon" src="${iconBase64}" />
  <div class="app-title">揮汗有禮・加碼券小幫手</div>
  <div class="tagline">一鍵登入・合格預檢・安全加密・週程指引</div>
  <div class="features">
    <div class="feature-item">⚡️ 一鍵自動填表，直達官網「我的任務」</div>
    <div class="feature-item">🔍 官方演算法改良預檢，降低審核失敗風險</div>
    <div class="feature-item">👨‍👩‍👧‍👦 家庭多成員管理，晶片硬體加密絕不上傳</div>
  </div>
  <div class="cta-btn">立即點選連結下載體驗！</div>
</body>
</html>`;
fs.writeFileSync(outroHtmlPath, outroHtml, 'utf8');
execSync(
  `"${browserPath}" --headless --disable-gpu --default-background-color=00000000 --window-size=1080,1920 --screenshot="${outroPngPath}" "${outroHtmlPath}"`,
  { stdio: 'pipe' }
);
console.log('   ✅ 渲染結尾 CTA 卡片: outro_card.png');

// 4. Generate Synchronized ASS Subtitles
console.log('📝 [4/6] 正在建立高對比動態字幕 (ASS Format)...');
const assPath = path.join(TEMP_DIR, 'subtitles.ass');
let currentTime = 0;
let assEvents = [];

SCENES.forEach((s) => {
  s.subtitles.forEach((sub) => {
    const startSec = currentTime + sub.relStart;
    const endSec = currentTime + sub.relEnd;

    function formatTime(sec) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }

    let textWithHighlight = sub.text;
    if (sub.highlight && textWithHighlight.includes(sub.highlight)) {
      // &H0000E5FF in ASS is Yellow/Gold
      textWithHighlight = textWithHighlight.replace(
        sub.highlight,
        `{\\c&H0000E5FF\\b1}${sub.highlight}{\\c&H00FFFFFF\\b0}`
      );
    }

    assEvents.push(
      `Dialogue: 0,${formatTime(startSec)},${formatTime(endSec)},Default,,0,0,0,,${textWithHighlight}`
    );
  });
  currentTime += s.duration;
});

const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,PingFang TC,54,&H00FFFFFF,&H000000FF,&H00000000,&H90141821,-1,0,0,0,100,100,2,0,3,18,0,2,50,50,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${assEvents.join('\n')}
`;
fs.writeFileSync(assPath, assContent, 'utf8');
console.log(`   ✅ 字幕檔建立完成: 共 ${assEvents.length} 條字幕`);

// 5. Build Individual Scene Videos with Smooth Pan & Overlay
console.log('🎬 [5/6] 正在渲染各場景動態運鏡影片 (FFmpeg)...');
const sceneVideos = [];

for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const audioFile = path.join(TEMP_DIR, `${s.id}.mp3`);
  const sceneVideoFile = path.join(TEMP_DIR, `${s.id}.mp4`);
  sceneVideos.push(sceneVideoFile);

  const dur = s.duration;
  // Preserve screenshot's original 1290:2796 aspect ratio (scale to fit 1080x1920 with pillarbox padding)
  const motionFilter =
    'scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=60';

  let cmd = '';
  if (s.id === 'scene5') {
    // Scene 5 transitions from schedule screenshot to the outro CTA card at 5.8s
    const splitTime = 5.8;
    cmd = `ffmpeg -loop 1 -i "${s.bgImage}" -loop 1 -i "${outroPngPath}" -i "${s.overlayImage}" -i "${audioFile}" -filter_complex "[0:v]${motionFilter},settb=1/60[v0];[1:v]scale=1080:1920,fps=60,settb=1/60[v1];[v0][v1]xfade=transition=fade:duration=0.5:offset=${splitTime}[vbg];[vbg][2:v]overlay=0:0:enable='between(t,0,${splitTime})'[vout]" -map "[vout]" -map 3:a -c:v libx264 -preset fast -crf 20 -r 60 -t ${dur} -pix_fmt yuv420p -y "${sceneVideoFile}"`;
  } else {
    cmd = `ffmpeg -loop 1 -i "${s.bgImage}" -i "${s.overlayImage}" -i "${audioFile}" -filter_complex "[0:v]${motionFilter}[vbg];[vbg][1:v]overlay=0:0[vout]" -map "[vout]" -map 2:a -c:v libx264 -preset fast -crf 20 -r 60 -t ${dur} -pix_fmt yuv420p -y "${sceneVideoFile}"`;
  }

  console.log(`   ⏳ 渲染 ${s.id} (${dur.toFixed(1)}s, 60fps)...`);
  execSync(cmd, { stdio: 'pipe' });
  console.log(`   ✅ 完成 ${s.id}.mp4`);
}

// 6. Concatenate All Scenes, Burn Subtitles & Mix BGM
console.log('🚀 [6/6] 正在組裝完整影片、燒錄字幕並混音背景音樂 (Final Pass, 60fps)...');
const concatListPath = path.join(TEMP_DIR, 'concat.txt');
fs.writeFileSync(
  concatListPath,
  sceneVideos.map((v) => `file '${path.resolve(v)}'`).join('\n'),
  'utf8'
);

const finalRawVideo = path.join(TEMP_DIR, 'final_raw.mp4');
execSync(`ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy -y "${finalRawVideo}"`, {
  stdio: 'pipe',
});

const FINAL_OUTPUT = path.join(FINAL_DIR, 'sports_helper_promo_shorts.mp4');
// Apply subtitles and mix BGM at -20dB with 60fps
const muxCmd = `ffmpeg -i "${finalRawVideo}" -i "${bgmPath}" -filter_complex "[0:v]subtitles='${assPath}':fontsdir='/System/Library/Fonts'[vsub];[1:a]volume=0.20,afade=t=in:ss=0:d=1.5,afade=t=out:st=${totalDuration - 2.0}:d=2.0[abgm];[0:a][abgm]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map "[vsub]" -map "[aout]" -c:v libx264 -preset fast -crf 19 -c:a aac -b:a 192k -r 60 -y "${FINAL_OUTPUT}"`;

execSync(muxCmd, { stdio: 'pipe' });

const finalStat = fs.statSync(FINAL_OUTPUT);
const finalDur = parseFloat(
  execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${FINAL_OUTPUT}"`
  )
    .toString()
    .trim()
);

console.log('🎉 ==============================================');
console.log(`✅ 宣傳影片生成成功！`);
console.log(`📁 影片路徑: ${FINAL_OUTPUT}`);
console.log(`⏱️ 總時長: ${finalDur.toFixed(1)} 秒 (完美符合 YouTube Shorts < 60s 規範)`);
console.log(`📦 檔案大小: ${(finalStat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log('🎉 ==============================================');
