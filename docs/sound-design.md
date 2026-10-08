# Thiết kế âm thanh giao diện — tuyen-portfolio

> Tài liệu kế hoạch. Đây là hợp đồng chung cho 4 người làm song song: **engine** (`src/sound/*`, `App.tsx`, `main.tsx`, `content.ts`, `setupTests.ts`), **shell**, **story**, **work**. Mọi tên trong `code` là định danh tiếng Anh, phải dùng đúng chữ.

---

## 1. Ý tưởng tổng thể

Trang là một "phòng chiếu ban đêm": nền đen, ánh emerald `#34d399`, chữ biên tập, chuyển động chậm. Âm thanh đi theo đúng tính cách đó:

- **Ít và nhỏ.** Âm thanh là lớp "xúc giác", không phải nhạc nền. Hover gần như chỉ cảm thấy, click như chạm vào kính, chỉ vài khoảnh khắc mang tính điện ảnh (intro ACCESS GRANTED, cổng About, phim Skills, màn trắng ở Contact).
- **Một giọng duy nhất.** Mọi âm có cao độ đều nằm trong **D Lydian** (D E F♯ G♯ A B C♯). Các nốt bước (tick theo hàng, ô công nghệ, mốc timeline, nấc zoom) dùng **D major pentatonic** (D E F♯ A B) để quét chuột qua nghe như một arpeggio êm. Nốt G♯ (màu Lydian) chỉ dùng trong chuông và hợp âm signature để tạo cảm giác "mở, sáng, hơi huyền ảo".
- **Ba chất liệu:** (1) kính, cho UI thường; (2) không khí, cho chuyển cảnh (noise lọc); (3) bạc, cho chuông và mô hình 3D (FM bell, partial lệch hòa âm). Intro là chỗ duy nhất có chất "máy/terminal".
- **0 KB tài nguyên.** Tất cả được tổng hợp bằng Web Audio API lúc chạy. Không tải file âm thanh, không có vấn đề bản quyền.

### Có dùng nhạc nền (ambient bed) không? **Không.**

Lý do:
1. Người dùng bật âm thanh để có phản hồi khi thao tác, không phải để nghe nhạc. Một lớp pad liên tục sẽ gây mệt sau 1 đến 2 phút đọc, mà portfolio thường được đọc lâu.
2. Trang đã chạy three.js, nhiều vòng rAF và canvas. Thêm một graph âm thanh chạy liên tục sẽ tốn CPU trên điện thoại.
3. Cảm giác điện ảnh đã có ở các điểm nhấn rời rạc (intro, cổng About, phim Skills, màn trắng Contact). Khoảng lặng giữa chúng làm các điểm nhấn có giá trị hơn.
4. Tránh độ phức tạp: không phải duck hay crossfade theo section, không có vòng lặp cần dừng khi ẩn tab.

Vì vậy cũng **không** có loop vận tốc khi kéo quả cầu hay mô hình. Thay vào đó dùng **grain**: các hạt âm ngắn, được giới hạn tần suất, độ lớn theo vận tốc. Kết quả nghe như ma sát thật, và tự tắt khi quán tính dừng.

---

## 2. Chính sách (bắt buộc)

| Quy tắc | Chi tiết |
|---|---|
| Mặc định TẮT | `localStorage['sound']` là `'on'` hoặc `'off'`. Không có giá trị thì coi là `'off'`. Đọc và ghi đều bọc `try/catch`. |
| Bật bằng nút rõ ràng | `SoundToggle` trong header (desktop, cạnh nút VI/EN) và trong sheet di động. Biểu tượng là 4 thanh equalizer chuyển động khi bật, nằm phẳng khi tắt. Có `aria-pressed` và nhãn VI/EN. |
| AudioContext chỉ tạo trong cử chỉ người dùng | `new AudioContext()` và `resume()` chỉ chạy trong handler `pointerdown`, `keydown`, `touchend` hoặc `click`. Không bao giờ tạo lúc tải trang. |
| Không phát khi chưa được phép | Ngay cả khi `'sound' = 'on'` (khách quay lại), trình duyệt vẫn chặn cho tới cử chỉ đầu tiên. Engine **bỏ** âm (không xếp hàng) khi context chưa `running`. |
| Intro: "Bật âm thanh" | Intro có thêm một nút nhỏ `BẬT ÂM THANH` / `SOUND ON` ở góc dưới bên trái, đối xứng với `SKIP →`. Bấm vào là cử chỉ, nên phần còn lại của intro (tick boot, ACCESS GRANTED, sweep, hand-off) sẽ có tiếng. Nút này **không** bỏ qua intro. |
| Ẩn tab | `visibilitychange` sang hidden: sau 400 ms nếu vẫn ẩn thì `ctx.suspend()`. Độ trễ này để tiếng `linkOut` không bị cắt khi mở tab mới. Hiện lại và đang bật thì `resume()`. |
| `prefers-reduced-motion` | Giữ phản hồi click và toggle (`source: 'user'`). Bỏ mọi âm `source: 'auto'` (cuộn, IntersectionObserver, hẹn giờ) và các id chuyển động: `grain`, `glide`, `whoosh`, `swell`, `reveal`, `sand`, `granted`, `boot`. Lắng nghe thay đổi media query trực tiếp. |
| Âm lượng thận trọng | Master −18 dB. Mọi giọng có mức đỉnh từ −4 đến −16 dB trước master, nên đỉnh thực tế khoảng −22 đến −34 dBFS. Có compressor và limiter. |
| Chống spam | Mỗi id có `minInterval`. Hover dùng chung một nhóm (70 ms). `reveal` dùng chung giới hạn 1200 ms. Tối đa 16 giọng cùng lúc. Âm cuộn chỉ phát ở mốc rời rạc có hysteresis, không bao giờ phát mỗi frame. |
| Cuộn do chương trình | Click vào link `#hash` gọi `sfx.suppressAuto(ms)`. Trong khoảng đó mọi âm `source: 'auto'` bị bỏ, để nhảy từ đầu trang tới Contact không gây một tràng âm reveal và mốc. |
| Môi trường test | jsdom không có `AudioContext`: `supported = false`, `play()` không làm gì, không ném lỗi. |
| Không mang thông tin chỉ bằng âm thanh | Mọi trạng thái đều đã có biểu hiện hình ảnh. Âm thanh chỉ bổ sung. |

---

## 3. Kiến trúc `src/sound/`

```
src/sound/
  index.ts            // re-export công khai — integrator CHỈ import từ '../sound' (hoặc đường dẫn tương đối tới src/sound)
  types.ts            // SoundId, SoundOptions, SOUND_IDS, SoundSnapshot
  notes.ts            // NOTE (Hz), PENTA, stepFreq()
  voices.ts           // VOICES: Record<SoundId, VoiceSpec> — công thức tổng hợp
  engine.ts           // createSoundEngine(env) + singleton `sfx`
  delegate.ts         // classifyClick() — luật âm click toàn cục (hàm thuần, có test)
  milestone.ts        // milestone(on, rearm) — phát hiện vượt ngưỡng có hysteresis
  SoundProvider.tsx   // gắn listener toàn cục, bọc App
  useSound.ts         // hook React (useSyncExternalStore)
  SoundToggle.tsx     // nút bật/tắt (equalizer)
  soundToggle.css
  engine.test.ts, delegate.test.ts, milestone.test.ts, SoundToggle.test.tsx
```

### 3.1 API (hợp đồng chính xác)

```ts
// types.ts
export type SoundId =
  | 'hover' | 'tap' | 'press'
  | 'toggleOn' | 'toggleOff' | 'lang'
  | 'menuOpen' | 'menuClose'
  | 'modalOpen' | 'modalClose'
  | 'slide' | 'tick' | 'bump'
  | 'glide' | 'whoosh' | 'reveal' | 'swell'
  | 'grain' | 'drop' | 'chime' | 'linkOut'
  | 'boot' | 'granted' | 'sand';

export const SOUND_IDS: readonly SoundId[]; // đúng 24 id trên, cùng thứ tự

export interface SoundOptions {
  /** -1 (trái) … 1 (phải). Mặc định 0. Dùng sfx.panAt(clientX) cho vị trí trên màn hình. */
  pan?: number;
  /** 0…1, mặc định 1. Nhân gain (cong ^1.5) và, với một số giọng, độ dài/độ sáng. */
  intensity?: number;
  /** Hệ số cao độ, mặc định 1. >1 cao hơn / "đi lên", <1 thấp hơn / "đi xuống". */
  rate?: number;
  /** Bậc trong thang pentatonic cho giọng có cao độ (tick, chime). 0 = D5. Âm hoặc dương đều được. */
  step?: number;
  /** Trễ, tính bằng ms (lên lịch theo đồng hồ AudioContext, không hủy được). */
  delay?: number;
  /** 'user' (mặc định): do người dùng trực tiếp gây ra. 'auto': cuộn / IO / hẹn giờ / tự động. */
  source?: 'user' | 'auto';
}

export interface SoundSnapshot {
  enabled: boolean;   // người dùng đã bật
  supported: boolean; // trình duyệt có Web Audio
}
```

```ts
// engine.ts
export interface SoundEngine {
  readonly supported: boolean;
  play(id: SoundId, opts?: SoundOptions): void;   // luôn an toàn: không ném lỗi, không trả gì
  isEnabled(): boolean;
  /** Gọi trong cử chỉ người dùng. true: lưu 'on', tạo/resume context, phát 'toggleOn'.
   *  false: phát 'toggleOff', giảm master về 0 trong 250 ms, suspend, lưu 'off'. */
  setEnabled(on: boolean): void;
  toggle(): void;
  /** Gọi trong cử chỉ: nếu đang bật thì tạo/resume context. Provider tự gọi; ít khi cần gọi tay. */
  unlock(): void;
  /** true khi enabled && context running && tab hiện. Dùng để bỏ qua tính toán tốn kém. */
  ready(): boolean;
  /** Bỏ mọi âm source:'auto' trong `ms` mili giây tới (lấy max nếu gọi chồng). */
  suppressAuto(ms: number): void;
  /** clientX → pan trong [-0.6, 0.6]. */
  panAt(clientX: number): number;
  subscribe(listener: () => void): () => void;
  getSnapshot(): SoundSnapshot;  // trả về CÙNG object cho tới khi có thay đổi
  /** Gắn listener toàn cục (unlock gesture, visibility, reduced-motion, click delegate). Trả về hàm gỡ. */
  install(): () => void;
}

export interface SoundEnv {
  AudioContextCtor?: typeof AudioContext;      // mặc định window.AudioContext ?? webkitAudioContext
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  now?: () => number;                          // mặc định performance.now
  matchMedia?: (q: string) => MediaQueryList;  // có thể undefined (jsdom)
  random?: () => number;                       // để test xác định
}
export function createSoundEngine(env?: SoundEnv): SoundEngine;
export const sfx: SoundEngine;                 // singleton dùng env mặc định
export const SOUND_STORAGE_KEY = 'sound';
export const MASTER_DB = -18;
```

```ts
// useSound.ts
export function useSound(): {
  enabled: boolean;
  supported: boolean;
  setEnabled: (on: boolean) => void;
  toggle: () => void;
  play: SoundEngine['play'];
};
// cài đặt: useSyncExternalStore(sfx.subscribe, sfx.getSnapshot, () => SERVER_SNAPSHOT)

// SoundProvider.tsx
export function SoundProvider({ children }: { children: ReactNode }): JSX.Element;
// useEffect(() => sfx.install(), []) rồi render children. Không có context value: hook đọc singleton.

// SoundToggle.tsx
export interface SoundToggleProps { variant?: 'header' | 'sheet'; className?: string }
export function SoundToggle(props: SoundToggleProps): JSX.Element;

// milestone.ts
export interface Milestone {
  /** true đúng một lần khi value tăng qua `on` lúc đang armed. Tự re-arm khi value < rearm. */
  update(value: number): boolean;
  /** Đặt trạng thái im lặng theo value hiện tại: armed = value < on. */
  sync(value: number): void;
}
export function milestone(on: number, rearm: number): Milestone;

// delegate.ts
export type SfxCall = [SoundId, SoundOptions];
export function classifyClick(
  el: Element,
  view: { scrollY: number; innerHeight: number; clientX: number | null; panAt: (x: number) => number },
): { calls: SfxCall[]; suppressMs: number };

// index.ts
export { sfx, createSoundEngine, SOUND_STORAGE_KEY, MASTER_DB } from './engine';
export { useSound } from './useSound';
export { SoundProvider } from './SoundProvider';
export { SoundToggle } from './SoundToggle';
export { milestone } from './milestone';
export type { SoundId, SoundOptions, SoundSnapshot } from './types';
```

Integrator dùng `import { sfx } from '../sound'` (đường dẫn tương đối từ file của mình). Gọi `sfx.play(...)` được ở mọi nơi, kể cả file không phải React (`stage.ts`, `avatarStage.ts`). Khi đang tắt, chi phí chỉ là một phép so sánh boolean.

### 3.2 Thứ tự kiểm tra trong `play()`

1. `!enabled` → bỏ.
2. Không có context, hoặc `ctx.state !== 'running'` → bỏ (không xếp hàng).
3. `document.hidden` → bỏ.
4. Reduced motion và (`source === 'auto'` hoặc id thuộc `REDUCED_DROP`) → bỏ.
   `REDUCED_DROP = { grain, glide, whoosh, reveal, swell, sand, granted, boot }`.
5. `source === 'auto'` và `now < suppressUntil` → bỏ.
6. Throttle: `now - last[id] < minInterval(id, intensity)` → bỏ. Nhóm `hover` dùng chung khóa. `reveal` còn có thêm khóa toàn cục 1200 ms.
7. Số giọng đang kêu ≥ 16 → bỏ.
8. Ngẫu nhiên hóa: `rate *= 2^((rand−0.5)·70/1200)` (±35 cent). `gainDb += (rand−0.5)·3` (±1.5 dB). Offset noise ngẫu nhiên.
9. `t0 = ctx.currentTime + 0.01 + delay/1000`. Dựng giọng, `pan` qua `StereoPannerNode`, gửi reverb theo `send`. Ngắt kết nối node khi source cuối kết thúc (`onended`).

### 3.3 Chuỗi master

```
voice → StereoPanner ─┬─ dry ───────────────────────────────┐
                      └─ send(gain=VOICES[id].send) → reverbIn
reverbIn → Convolver(IR sinh bằng code) → highpass 180 Hz → lowpass 7 kHz → wet(0.9) ┘
                                                                         ↓
masterIn(1) → highpass 30 Hz → Compressor(thr −20, knee 10, ratio 3, atk 4 ms, rel 200 ms)
            → masterGain(dB −18 ≈ 0.126; ramp 0 khi tắt)
            → Limiter = Compressor(thr −6, knee 0, ratio 20, atk 1 ms, rel 50 ms) → destination
```

- **Impulse reverb sinh bằng code:** stereo, dài 1.6 s, pre-delay 12 ms (mẫu 0). Mỗi kênh là noise trắng độc lập nhân với `(1 − t/T)^2.2 · e^(−3t)`. Một bộ lọc thông thấp 1 cực có hệ số tăng dần từ 0.55 lên 0.9 theo t, để đuôi tối dần như phòng thật. Tạo một lần khi tạo context.
- **Bộ đệm noise:** 2 s noise trắng mono, tạo một lần. Mỗi lần phát bắt đầu từ một offset ngẫu nhiên.
- **Envelope chuẩn:** `g.setValueAtTime(0.0001, t)` → `linearRamp(peak, t + a)` → `exponentialRamp(0.0001, t + a + d)`.
- **iOS Safari:** trong `unlock()` phát một buffer im lặng dài 1 mẫu để mở khóa.

### 3.4 Delegate click toàn cục (engine sở hữu, cài trong `install()`)

Một listener `click` ở `document`, pha capture. Bắt `click` (không phải `pointerdown`) để cả bàn phím Enter/Space cũng có tiếng.

1. `el = target.closest('a[href], button, [role="button"]')`. Không có thì thôi.
2. `mark = el.closest('[data-sfx]')?.getAttribute('data-sfx')` (tính cả tổ tiên).
   - `mark === 'off'` → không phát gì. **Quy tắc vàng: phần tử nào đã tự gọi `sfx.play` trong handler click thì phải có `data-sfx="off"`.**
   - `mark` là một `SoundId` hợp lệ (thường là `press`) → lớp "nhấn" là id đó.
   - Không có `mark`: `button` / `[role=button]` → `tap`. `a` → không có lớp nhấn.
   - `button:disabled` hoặc `aria-disabled="true"` → không phát gì.
3. Lớp "điều hướng" (chỉ cho `a[href]`, cộng thêm vào lớp nhấn):
   - có thuộc tính `download` → `drop` `{ intensity: 0.5 }`.
   - `target="_blank"`, `mailto:`, `tel:`, hoặc http(s) khác origin → `linkOut`.
   - `href` bắt đầu bằng `#` và phần tử đích tồn tại: `dy = target.getBoundingClientRect().top` → `glide { intensity: clamp(|dy| / (3·innerHeight), 0.15, 1), rate: dy < 0 ? 1.12 : 0.9 }` và `suppressMs = clamp(600 + |dy|·0.4, 600, 2500)`. Gọi `suppressAuto` kể cả khi reduced motion (glide bị bỏ nhưng chặn cascade vẫn cần).
4. `pan = clientX !== null ? panAt(clientX) : 0` (`clientX` là null khi `e.detail === 0`, tức là kích hoạt bằng bàn phím).

### 3.5 Hover toàn cục

Shell sở hữu, nằm trong `CursorDot.tsx`. Chỉ khi có chuột (fine pointer). Phát `hover` khi phần tử tương tác dưới con trỏ **thay đổi**. Phần tử có tổ tiên `data-sfx-hover="off"` thì im lặng (vì chúng tự có âm hover riêng). Không có hover trên cảm ứng.

### 3.6 Mốc cuộn (`milestone`)

```ts
const m = milestone(0.03, 0.01);
// mỗi frame (luôn gọi update trước để re-arm đúng):  if (m.update(v) && scrollingForward) sfx.play('swell', { source: 'auto' });
// khi snap / mount / deep link:  m.sync(v);  // im lặng
```

Chỉ phát khi giá trị **tăng** (cuộn xuống). Cuộn ngược im lặng. Nếu trong một frame có hơn một mốc bắn, chỉ phát mốc cuối.

---

## 4. Thang âm và nốt

```ts
// notes.ts
export const NOTE = {
  D2: 73.42, A2: 110.0, D3: 146.83, A3: 220.0,
  D4: 293.66, E4: 329.63, Fs4: 369.99, Gs4: 415.3, A4: 440.0, B4: 493.88, Cs5: 554.37,
  D5: 587.33, E5: 659.26, Fs5: 739.99, A5: 880.0, B5: 987.77, Cs6: 1108.73,
  D6: 1174.66, E6: 1318.51, Gs6: 1661.22, A6: 1760.0, Cs7: 2217.46, E7: 2637.02,
} as const;
export const PENTA = [0, 2, 4, 7, 9] as const; // D E F# A B (bán cung tính từ D)
/** step 0 = D5. step 5 = D6. step -5 = D4. */
export function stepFreq(step: number): number {
  const oct = Math.floor(step / 5);
  const deg = ((step % 5) + 5) % 5;
  return NOTE.D5 * Math.pow(2, oct + PENTA[deg] / 12);
}
```

---

## 5. Bảng âm (24 id)

Cột **dB** là mức đỉnh của giọng trước master (−18 dB). **min** là khoảng tối thiểu giữa hai lần phát cùng id. **send** là lượng gửi vào reverb. **R** là có giữ khi reduced motion (✓) hay không (✗).

| id | Mục đích | Công thức tổng hợp | dB | min (ms) | send | R |
|---|---|---|---|---|---|---|
| `hover` | Hover phần tử tương tác (toàn cục) | Sine `A6·rate` (1760 Hz), a 1 ms, d 28 ms. Cộng noise bandpass 5 kHz (Q 1.2), d 8 ms, ở −10 dB tương đối. Âm "tick kính" rất ngắn. | −16 | 70 (nhóm) | 0.05 | ✓ |
| `tap` | Click nút thường | Triangle `D5·rate`, pitch trượt ×1 → ×0.92 trong 40 ms, a 1 ms, d 70 ms. Partial kính: sine `D5·2.76`, d 35 ms, −12 dB. Noise lowpass 900 Hz, d 15 ms (lớp "thump" nhỏ). | −6 | 60 | 0.08 | ✓ |
| `press` | CTA chính (nút trắng, glow, pill) | Sine `D4` pitch ×1 → ×0.94 trong 80 ms, d 160 ms. Triangle `A4`, d 120 ms, −8 dB. Halo sine `F♯5`, d 260 ms, −14 dB. Noise bandpass 1.2 kHz, d 20 ms, −14 dB. | −4 | 120 | 0.15 | ✓ |
| `toggleOn` | Bật (âm thanh, ngày) | Hai nốt đi lên `A5` → `D6` cách 45 ms. Mỗi nốt là sine cộng triangle ×2 ở −14 dB, a 2 ms, d 90 ms. | −9 | 150 | 0.12 | ✓ |
| `toggleOff` | Tắt (âm thanh, đêm) | `D6` → `A5` đi xuống, cách 45 ms, qua lowpass 3 kHz. | −11 | 150 | 0.12 | ✓ |
| `lang` | Đổi VI/EN | Hai sine cách quãng năm, cách 30 ms: `rate ≥ 1` là `D5 → A5`, `rate < 1` là `A5 → D5`. d 80 ms mỗi nốt. Noise "lật kính" highpass 3 kHz, d 10 ms. | −10 | 200 | 0.10 | ✓ |
| `menuOpen` | Mở dropdown / sheet | Noise bandpass (Q 0.9), tâm quét 600 → 2400 Hz trong 160 ms, a 40 ms, d 180 ms. Tại +40 ms: tick sine `F♯5`, a 2 ms, d 60 ms, −16 dB. `intensity` kéo dài d (tối đa ×1.4 cho sheet). | −12 | 250 | 0.20 | ✓ |
| `menuClose` | Đóng dropdown / sheet | Noise bandpass quét 2000 → 500 Hz trong 140 ms, a 10 ms, d 140 ms. Không có tick. | −15 | 150 | 0.15 | ✓ |
| `modalOpen` | Mở modal | Noise bandpass quét lên 500 → 1800 Hz, 220 ms. Thump sine 130 Hz, a 2 ms, d 120 ms, −10 dB. Tại +180 ms: cặp sine `F♯5` và `A5`, d 300 ms, −12 dB ("tấm kính đặt xuống"). | −9 | 300 | 0.25 | ✓ |
| `modalClose` | Đóng modal | Noise bandpass quét 1600 → 500 Hz, 150 ms. Sine `D5`, d 80 ms, −16 dB. | −13 | 200 | 0.15 | ✓ |
| `slide` | Chuyển ngang có hướng (panel, slider, gallery, hiện vật) | Noise bandpass tâm `1500·rate` Hz (Q 1.4). Độ dài `0.08 + 0.22·intensity` s, a 15 ms. Pan tự động từ `pan·0.3` tới `pan` trong suốt âm (cảm giác di chuyển). Tick gỗ ở đầu: triangle `B4·rate`, a 1 ms, d 30 ms, −12 dB. | −12 | 90 | 0.12 | ✓ |
| `tick` | Nốt bước có cao độ (hàng, ô, mốc, nấc, đếm) | Sine `stepFreq(step ?? 5)·rate`, a 1 ms, d 45 ms. Triangle một quãng tám dưới, d 30 ms, −12 dB. Gain nhân `intensity`. | −10 | 45 | 0.10 | ✓ |
| `bump` | Chạm giới hạn / lỗi | Sine 110 Hz·rate trượt xuống 80 Hz, a 1 ms, d 90 ms. Square 116 Hz, d 60 ms, −18 dB, qua lowpass 400 Hz. Noise lowpass 300 Hz, d 25 ms. | −10 | 250 | 0.05 | ✓ |
| `glide` | Điều hướng trong trang (`#hash`) | Noise qua lowpass. `rate > 1` (đi lên): cutoff 500 → 3500 Hz. `rate < 1` (đi xuống): 3500 → 500 Hz. Độ dài `0.35 + 0.55·intensity` s, a = 35% độ dài. Khi `intensity > 0.6` thêm sine `D3`, −20 dB. | −12 | 400 | 0.25 | ✗ |
| `whoosh` | Chuyển cảnh điện ảnh (cổng, sweep, focus, mốc phim) | Noise bandpass (Q 0.7), tâm quét `300·rate → 2800·rate` Hz trong `0.5 + 0.7·intensity` s, a 45%. Có `pan` thì pan quét `−pan → pan`. Khi `intensity ≥ 0.8` thêm sine "hút" `D2 → D3` glide, −14 dB. | −8 | 300 | 0.30 | ✗ |
| `reveal` | Shimmer khi nội dung hiện ra | Ba sine `A5`, `C♯6`, `E6` (màu Lydian) lệch nhau 0 / 40 / 80 ms, a 8 ms, d 600 ms, mỗi cái −6 dB. Noise highpass 6 kHz, a 100 ms, d 400 ms, −18 dB. | −14 | 400 (+ khóa toàn cục 1200) | 0.35 | ✗ |
| `swell` | Pad điện ảnh (hero, cổng About, màn trắng, hand-off intro) | Hợp âm `D3 + A3 + F♯4 + G♯4` (G♯ ở −10 dB). Mỗi nốt là 2 sawtooth lệch ±6 cent qua lowpass quét 300 → 1800 → 600 Hz. Độ dài `1.2 + 1.0·intensity` s, a 45%. Noise air lowpass 2 kHz, −18 dB. | −10 | 1500 | 0.40 | ✗ |
| `grain` | Hạt ma sát khi kéo / quay | Noise 18–30 ms qua bandpass Q 3, tâm `(800 + 2200·intensity)·rate` Hz ±15% ngẫu nhiên. Gain `intensity^1.5`. Khi `rate ≥ 1.3` (chất bạc) thêm sine 2.4 kHz·rate, d 40 ms, −14 dB. | −14 | `110 − 60·intensity` | 0.08 | ✗ |
| `drop` | Đặt xuống / lắng (thả, đáp, tải CV) | Sine `220·rate → 110·rate` trong 120 ms, a 2 ms, d `0.18·(0.5 + intensity)` s. Noise lowpass 600 Hz, d 60 ms. Khi `intensity ≥ 0.9` thêm sub `D2` sine, d 400 ms, −8 dB. | −6 | 150 | 0.15 | ✓ |
| `chime` | Thành công / chuông bạc | FM bell: carrier `stepFreq(step ?? 5)·rate` (mặc định D6). Modulator = carrier ×1.4; chỉ số điều chế 2.5·f → 0 trong 400 ms. Biên độ a 2 ms, d 1.2 s. Partial `A6·rate`, d 0.8 s, −10 dB. | −8 | 300 | 0.35 | ✓ |
| `linkOut` | Rời trang (tab mới, mailto) | Sine portamento `A5 → E6` trong 120 ms, a 2 ms, d 220 ms. Noise highpass 4 kHz tăng dần, 80 ms, −16 dB. | −10 | 250 | 0.15 | ✓ |
| `boot` | Dòng boot trong intro (chất terminal) | Click noise bandpass 3.2 kHz (Q 2), d 6 ms. Blip square `E6·rate` qua lowpass 4 kHz, d 12 ms, −14 dB. `intensity ≥ 0.95` ([OK]): thêm blip `A6` tại +40 ms, d 40 ms. Gain nhân `intensity` (dòng sub 0.5). | −12 | 40 | 0.05 | ✗ |
| `granted` | ACCESS GRANTED — âm signature | t: triangle `D4` + sine `A4` (−6), a 10 ms, d 1.2 s. t+140 ms: sine `F♯5` + `C♯6` (−8), d 1.0 s. Shimmer: 4 sine `E6`, `G♯6`, `A6`, `C♯7` ở offset ngẫu nhiên 180–450 ms, d 0.5 s, −18 dB. Sub `D2`, d 600 ms, −14 dB. | −6 | 5000 | 0.40 | ✗ |
| `sand` | Huy hiệu tan cát rồi kết tinh (Certifications) | 0–0.8 s: 28 hạt noise (8–20 ms, bandpass ngẫu nhiên 2–7 kHz, Q 4), mật độ giảm dần (tan). 0.9–1.5 s: 18 hạt với tâm bandpass tăng 3 → 8 kHz (gom lại). 1.5 s: ping pha lê sine `C♯7` + `E7`, d 400 ms, −12 dB. | −12 | 600 | 0.25 | ✗ |

Ghi chú về mức: `hover` (−16) thấp hơn `tap` (−6) 10 dB, tức khoảng 32% biên độ, đúng tỉ lệ 30–40%. Effective peak ≈ dB + (−18), ví dụ `press` ≈ −22 dBFS, `hover` ≈ −34 dBFS.

---

## 6. Bản đồ âm thanh theo khu vực

### 6.1 Header (Navbar) — shell

| Thao tác | Âm | Ghi chú |
|---|---|---|
| Header hiện ra sau intro | — | Im lặng có chủ đích (đã có `swell` ở hand-off intro). Không bao giờ phát lúc tải trang. |
| Hover trigger Hồ sơ / Dự án / Kết nối | `menuOpen` lần đầu, `slide` khi đổi panel | Trigger có `data-sfx="off"` và `data-sfx-hover="off"`. |
| Đổi panel (Profile ↔ Work ↔ Connect) | `slide { intensity: 0.3, rate: dir>0 ? 1.06 : 0.94, pan: dir·0.25 }` | Cao độ và pan theo hướng trượt. |
| Đóng dropdown | `menuClose` | Chỉ khi thật sự đang mở. Im lặng khi đóng do đổi ngôn ngữ, unmount, hoặc do click link trong panel (âm điều hướng đã đủ). |
| Hàng trong Profile | `tick { step: i, intensity: 0.5 }` khi đổi hàng | Đi xuống danh sách nghe như một thang âm. |
| Thẻ ảnh Work, link Connect | hover toàn cục, click qua delegate (`glide` / `linkOut` / `drop`) | Không cần code riêng. |
| VI / EN | `lang { rate: lang==='vi' ? 1.06 : 0.94 }` | `data-sfx="off"` trên nút. |
| **Nút âm thanh** | `toggleOn` / `toggleOff` | Engine tự phát trong `setEnabled`. |
| CTA "Liên hệ" | `press` + `glide` dài đi xuống | `data-sfx="press"`. |
| Logo về đầu trang | `glide` đi lên | Delegate. |
| Hamburger / sheet | `menuOpen { intensity: 1 }` / `menuClose` | Escape chỉ phát nếu sheet đang mở. Link trong sheet đóng sheet im lặng. |
| Scroll-spy, thu gọn header, thanh tiến độ | — | **Không gắn âm.** Scroll-spy đổi rất nhiều lần khi cuộn, một tick "chương" dễ thành nhiễu. Âm chương đã có ở reveal của từng section. |

### 6.2 Intro — shell

| Thời điểm | Âm |
|---|---|
| Mỗi dòng boot (0–2260 ms) | `boot { intensity: ok ? 1 : sub ? 0.5 : 0.8, source: 'auto' }` |
| ACCESS GRANTED (2900 ms) | `granted { source: 'auto' }` — chỉ khi chưa skip |
| Sweep (4600 ms) | `whoosh { intensity: 0.5, rate: 0.8, source: 'auto' }` |
| Hand-off tự nhiên (5000 ms) | `swell { intensity: 0.8, source: 'auto' }` |
| SKIP / Escape | `tap` (delegate) + `swell { intensity: 0.35 }` |
| Nút "BẬT ÂM THANH" | `setEnabled(true)` → `toggleOn`; các mốc phía sau có tiếng |

Khách lần đầu không bấm nút: intro im lặng hoàn toàn (đúng chính sách).

### 6.3 Story — Hero, About, Experience, Skills

- **Hero vào:** `swell { intensity: 0.7 }`, rồi tại +1050 ms `tick { step: 7, intensity: 0.6 }` khớp chấm emerald bật lên. **Đếm số:** `tick { step: round(p·4), intensity: 0.35 }` mỗi lần số đổi (throttle 45 ms), kết thúc `chime { intensity: 0.5 }`. **Avatar sẵn sàng:** `reveal { intensity: 0.6 }`. Tất cả `source: 'auto'`.
- **Xoay avatar bằng chuột:** như một núm vặn có nấc. `grain { intensity: 0.25, pan }` mỗi nấc 12°. `bump { intensity: 0.4 }` khi chạm ±70°.
- **CTA hero:** "Xem dự án" `data-sfx="press"` (→ `press` + `glide`). "Tải CV" → `drop`. GitHub → `linkOut`. Nút tròn cuộn xuống → `glide` đi xuống.
- **About:** cổng mở → `swell { intensity: 0.5 }`. Hover cổng → `tick { step: -5, intensity: 0.4 }` (âm trầm mời gọi, 600 ms/lần). Click cổng → `whoosh { intensity: 1 }` (hút vào), khi mở xong và bắt đầu cuộn → `drop { intensity: 0.8 }` và `suppressAuto(1500)`. Danh sách bên → `tick { step: i }` khi hover, `glide` khi click.
- **Experience:** tiêu đề hiện → `reveal { intensity: 0.5 }`. Nút timeline sáng lên khi cuộn xuống → `tick { step: active + 2, intensity: 0.6 }`, cuộn lên → `tick { step: active, intensity: 0.3, rate: 0.5 }`. Rail đầy → `chime { intensity: 0.4 }`. Hover thẻ → `hover { intensity: 0.6 }`.
- **Skills (phim cuộn ghim):** 4 mốc có hysteresis trên `smooth` (px):

  | Mốc | on | rearm | Âm |
  |---|---|---|---|
  | Tấm đá tách | 600 | 450 | `whoosh { intensity: 0.6, rate: 0.9 }` |
  | Vòng cung phóng lên | 1350 | 1200 | `whoosh { intensity: 0.8, rate: 1.25 }` |
  | Panel bảo mật | 1800 | 1650 | `chime { rate: 0.5, intensity: 0.6 }` |
  | Slider bay vào | 2800 | 2650 | `whoosh { intensity: 0.6, pan: 0.4 }` |
  | Nút điều khiển sẵn sàng | `controlsReady` false→true | — | `tap { rate: 0.8, intensity: 0.6 }` |

  Ô công nghệ trên vòng cung: `tick { step: i, intensity: 0.5 }` khi hover (arpeggio trái thấp, phải cao). Prev/Next: `slide { intensity: 1, pan: dir·0.4 }`. Chọn thẻ: `slide` nếu đổi, `tap` nếu là thẻ đang active.

### 6.4 Work — Archive, Projects, Atlas, Certifications

- **ArchiveSphere:** tiêu đề hiện → `swell { intensity: 0.45, delay: 700 }`. Bắt đầu kéo thật (vượt `clickSlop`) → `tap { rate: 0.7, intensity: 0.4 }`. Khi quay (kể cả quán tính) → `grain` theo vận tốc. Thả nhanh → `whoosh { intensity: 0.2–0.6 }`. Chọn ảnh → `chime { step: projectIndex, intensity: 0.4 }` rồi `modalOpen` (từ Modal). Hover ảnh trên quả cầu: **không** (ảnh tự trôi dưới con trỏ).
- **Projects:** tiêu đề → `reveal`. Nút 01/02/03 → `tick { step: i + 2 }` + `slide`. **Tự chuyển 5.2 s: im lặng.** Hover thẻ bento → `hover { intensity: 0.8, rate: 0.85 }`. Mở chi tiết → chỉ `modalOpen`.
- **Modal / Gallery:** mở/đóng tập trung trong `ui/Modal`. Prev/Next/phím mũi tên → `slide { intensity: 0.45, pan: ±0.3 }`. Thumbnail → `tick { step: i }`.
- **ArtifactAtlas:** model active tải xong → `chime { rate: 0.84, intensity: 0.6, source: 'auto' }`. Đổi hiện vật → `slide` có hướng, rồi tại +480 ms `chime { step: index + 3, intensity: 0.4 }` (khớp overshoot). Zoom → `slide { rate: 1.2 / 0.8 }`, chạm biên → `bump`. Focus → `whoosh` vào/ra. Ngày → `toggleOn { rate: 1.12 }`, đêm → `toggleOff { rate: 0.84 }`. Xoay 90° → `slide`, 360° → `whoosh` + `chime` khi xong. Kéo mô hình → `grain { rate: 1.4 }` (chất bạc). Nấc zoom bằng wheel/pinch → `tick` lượng tử hóa. Reset → `glide` nhẹ rồi `tick` khi về vị trí.
- **Certifications:** chọn chứng chỉ khác → `sand` (1.5 s khớp dòng thời gian tan/kết tinh). **Tự chuyển 5 s: im lặng.** Câu statement → `reveal`. Nút "Xác thực" → `drop { intensity: 0.7 }` + `chime { delay: 70 }` như đóng dấu.

### 6.5 Contact outro + chân trang — shell

Một cử chỉ điện ảnh duy nhất, theo mốc của `outroStages(p)`, chỉ khi cuộn xuống:

| Mốc | Ngưỡng | rearm | Âm |
|---|---|---|---|
| Màn trắng bắt đầu | overlay ↑ 0.03 | < 0.01 | `swell { intensity: 1 }` |
| Trắng hoàn toàn | overlay ↑ 0.97 | < 0.85 | `reveal { intensity: 0.7 }` |
| Viên pill bắt đầu lớn | pill ↑ 0.02 | < 0.005 | `whoosh { intensity: 0.6, rate: 0.7, pan: 0.4 }` |
| Pill chạm đích | pill ↑ 0.99 | < 0.6 | `drop { intensity: 1, pan: 0.3 }` + `chime { delay: 60, pan: 0.3 }` |
| Chân trang hiện | foot ↑ 0.95 | < 0.5 | `tick { step: 0, rate: 0.5, intensity: 0.4 }` |

Pill CTA mailto → `press` + `linkOut`. Nút về đầu trang → `glide` dài đi lên (cuộn ngược qua outro sẽ im lặng vì chỉ bắt chiều đi xuống, và `suppressAuto` chặn các reveal trên đường).

---

## 7. Nút bật/tắt âm thanh (`SoundToggle`)

```tsx
<button
  type="button"
  className={`sound-toggle sound-toggle--${variant}${enabled ? ' is-on' : ''} ${className ?? ''}`}
  aria-pressed={enabled}
  aria-label={t.sound.label}
  title={enabled ? t.sound.turnOff : t.sound.turnOn}
  data-sfx="off"
  onClick={toggle}
>
  <span className="sound-eq" aria-hidden="true"><i /><i /><i /><i /></span>
  {variant === 'sheet'
    ? <span className="sound-toggle-text" aria-hidden="true">{t.sound.label} · {enabled ? t.sound.stateOn : t.sound.stateOff}</span>
    : null}
</button>
```

CSS (`soundToggle.css`, engine viết):
- `header`: 32 × 32 px, `border-radius: 999px`, viền `1px solid var(--hdr-line)` (cùng chiều cao và viền với `.hdr-lang`), nền trong suốt, hover `rgba(255,255,255,0.08)`. `focus-visible`: outline 2 px `#34d399`, offset 2 px.
- `.sound-eq`: 4 thanh rộng 2 px, cách 2 px, cao tối đa 12 px, `transform-origin: bottom`, `border-radius: 1px`. Tắt: màu `rgba(255,255,255,0.55)`, `scaleY(0.25)`, transition 300 ms `cubic-bezier(0.22,1,0.36,1)`. Bật: màu `#34d399`, animation `sound-eq` (scaleY 0.3 ↔ 1, `alternate`, `ease-in-out`) với thời lượng 0.9 / 1.15 / 0.8 / 1.3 s và delay âm khác nhau để không đồng bộ.
- `@media (prefers-reduced-motion: reduce)`: không animation; khi bật các thanh đứng yên ở `scaleY` 0.5 / 0.9 / 0.65 / 0.8.
- `sheet`: chiều cao 40 px, padding 0 14 px, có chữ, căn trái.

---

## 8. Kiểm thử

- `engine.test.ts` (FakeAudioContext tự viết, đếm node được tạo):
  - Không có `AudioContextCtor`: `supported === false`, `play` không ném lỗi, `setEnabled(true)` vẫn lưu `'on'` và cập nhật snapshot.
  - Mặc định tắt. `storage` có `'on'` → `isEnabled() === true` nhưng không tạo context cho tới `unlock()`.
  - `play` khi context `suspended` → không tạo node.
  - Throttle: hai lần `tick` cách 10 ms → chỉ một lần dựng giọng. Nhóm `hover`.
  - `source: 'auto'` bị chặn bởi `suppressAuto` và bởi reduced motion. `tap` vẫn phát khi reduced.
  - `getSnapshot()` trả cùng một object khi không đổi.
- `delegate.test.ts`: `button` → `tap`; `a[href="#x"]` → `glide` với `rate` theo hướng và `suppressMs`; `a[target=_blank]` → `linkOut`; `a[download]` → `drop`; `data-sfx="off"` ở tổ tiên → rỗng; `data-sfx="press"` trên `a#hash` → `press` + `glide`; button disabled → rỗng.
- `milestone.test.ts`: chỉ bắn một lần khi đi lên; re-arm dưới `rearm`; `sync` im lặng.
- `SoundToggle.test.tsx`: render trong `LangProvider`; `aria-pressed` đổi khi click; ghi `localStorage.sound`; nhãn VI và EN.

Kiểm tra cuối: `npx tsc -b`, `npx vitest run`, `npx oxlint src`.

---

## 9. Nội dung song ngữ cần thêm vào `content.ts` (engine thêm)

```ts
// interface Content
sound: {
  label: string;
  turnOn: string;
  turnOff: string;
  stateOn: string;
  stateOff: string;
  introCta: string;
  introOn: string;
};
```

| key | vi | en |
|---|---|---|
| `sound.label` | Âm thanh | Sound |
| `sound.turnOn` | Bật âm thanh | Turn sound on |
| `sound.turnOff` | Tắt âm thanh | Turn sound off |
| `sound.stateOn` | Đang bật | On |
| `sound.stateOff` | Đang tắt | Off |
| `sound.introCta` | BẬT ÂM THANH | SOUND ON |
| `sound.introOn` | ÂM THANH ĐÃ BẬT | SOUND ENABLED |

---

## 10. Phân công tích hợp

Chi tiết từng file nằm ở mục 11. Quy tắc chung cho mọi integrator:

1. `import { sfx } from '<đường dẫn tương đối>/sound'`. Không import file con.
2. Phần tử nào tự gọi `sfx.play` trong handler click → thêm `data-sfx="off"`.
3. Phần tử nào tự có âm hover → thêm `data-sfx-hover="off"` (để `CursorDot` không phát `hover` chồng).
4. Hover tự viết chỉ chạy khi `e.pointerType === 'mouse'`.
5. Mọi âm do cuộn, IntersectionObserver, `whileInView`, hẹn giờ, hoặc tải xong → `source: 'auto'`.
6. Không bao giờ gọi `sfx.play` trong handler `scroll`, `pointermove` hay rAF **trừ khi** đi qua `milestone()`, hoặc là `grain` (engine tự throttle), hoặc là nấc lượng tử hóa đã kiểm tra thay đổi.
7. Không gắn âm vào: vòng tự động (FeaturedStage, Certifications), idle spin, parallax, spotlight, `useScrollScale`, `ImageTrail`, tải ảnh, effect theo `active` mà có đường đổi giá trị im lặng (`jump()` của slider).
8. Không sửa `content.ts`, `App.tsx`, `src/sound/*`.

---

## 11. Hướng dẫn tích hợp chi tiết

### 11.0 engine (làm trước, ba integrator code theo hợp đồng mục 3 song song)

- Tạo toàn bộ `src/sound/*` theo mục 3, 4, 5, 7, 8. `VOICES` phải có đủ 24 id với đúng `gainDb`, `minInterval`, `send` trong bảng mục 5.
- `src/App.tsx`: bọc bên trong `LangProvider` (vì `SoundToggle` dùng `useLang`): `<LangProvider><SoundProvider><MotionConfig ...>…</MotionConfig></SoundProvider></LangProvider>`. Không thêm gì khác.
- `src/main.tsx`: không cần đổi (giữ nguyên trừ khi cần import CSS; `SoundToggle.tsx` tự `import './soundToggle.css'`).
- `src/data/content.ts`: thêm `sound` vào `interface Content` và cả hai ngôn ngữ (mục 9). Nếu `content.test.ts` so khớp khóa giữa vi và en thì vẫn phải xanh.
- `src/setupTests.ts`: không bắt buộc. Engine phải tự an toàn khi thiếu `AudioContext` và `window.matchMedia` (jsdom thiếu cả hai).
- Engine không được tạo `AudioContext` ở thời điểm import module; chỉ tạo trong `unlock()` / `setEnabled(true)`.

### 11.1 shell

Phạm vi file: `src/components/Navbar.tsx`, `src/components/nav/*`, `src/components/intro/CinematicIntro.tsx`, `src/components/ui/CursorDot.tsx`, `src/components/ui/LangToggle.tsx`, `src/components/ui/SandTransition.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/PillButton.tsx`, `src/components/ui/ImageTrail.tsx`, `src/components/ContactSection.tsx`, `src/index.css`. KHÔNG sửa `src/App.tsx` (engine bọc `SoundProvider` ở đó) và không sửa `content.ts`. Import: `import { sfx, useSound, SoundToggle, milestone } from '../sound'` (từ `src/components/*`) hoặc `'../../sound'` (từ `src/components/ui|nav|intro/*`).

**1. `Navbar.tsx` — nút âm thanh**
- Trong `.hdr-actions` (khoảng dòng 391), chèn `<SoundToggle />` làm phần tử con ĐẦU TIÊN, trước `<button className="hdr-lang">`. Nút phải hiện ở mọi độ rộng, kể cả dưới 860px. Nếu `navbar.css` ẩn phần tử trong `.hdr-actions` ở mobile thì đảm bảo `.sound-toggle` vẫn hiện. Dùng `gap` sẵn có của `.hdr-actions`.
- Trong `.hdr-sheet`, ngay trước `<a className="hdr-sheet-cta">`, chèn `<SoundToggle variant="sheet" />`. Chỉ thêm style bố cục tối thiểu trong `navbar.css` nếu cần (ví dụ `margin-top: 12px; align-self: flex-start`). Không định nghĩa lại style `.sound-toggle` (engine sở hữu `soundToggle.css`).

**2. `Navbar.tsx` — dropdown (effect lớn, dòng 147–232)**
- `open(id)`, nhánh `if (!current)` (mở lần đầu): sau `dd!.classList.add('open')` gọi `const r = triggerOf(id).getBoundingClientRect(); sfx.play('menuOpen', { pan: sfx.panAt(r.left + r.width / 2) });`.
- Nhánh `else` (đổi panel): ngay sau `const dir = ...` gọi `sfx.play('slide', { intensity: 0.3, rate: dir > 0 ? 1.06 : 0.94, pan: dir * 0.25 });`.
- Đổi thành `function close(silent = false)`. Đầu hàm: `const wasOpen = current !== null;`. Cuối hàm: `if (wasOpen && !silent) sfx.play('menuClose');`.
- Gọi `close(true)` (im lặng) ở: listener `on(dd, 'click', ...)` khi click vào `a` (âm điều hướng của delegate đã đủ), và trong cleanup của effect (đổi ngôn ngữ / unmount) nếu cleanup có gọi close. Giữ `close()` có tiếng ở: click trigger để đóng, Escape, pointerdown bên ngoài, và `scheduleClose`. Trong `scheduleClose` phải viết `window.setTimeout(() => close(), ms)`, KHÔNG truyền `close` trực tiếp (setTimeout có thể truyền đối số lạ vào `silent`).
- Thêm `data-sfx="off"` và `data-sfx-hover="off"` lên mỗi `.hdr-trigger` (open/close đã có âm, click trigger không được phát thêm `tap`).
- Hàng Profile (dòng ~310): thay `onPointerEnter={() => setProfileRow(i)}` và `onFocus={() => setProfileRow(i)}` bằng `pick(i)`, với `const pick = (i: number) => { if (i !== profileRow) sfx.play('tick', { step: i, intensity: 0.5 }); setProfileRow(i); };`. Thêm `data-sfx-hover="off"` lên mỗi hàng. Click hàng (link `#...`) do delegate lo (`glide`).
- `.dd-card` (Work) và `.dd-link` (Connect): không cần code. CursorDot lo hover, delegate lo click (`glide`, `linkOut`, `drop` cho CV).

**3. `Navbar.tsx` — các nút khác**
- `.hdr-lang`: thêm `data-sfx="off"`; `onClick={() => { sfx.play('lang', { rate: lang === 'vi' ? 1.06 : 0.94 }); toggleLang(); }}`.
- `.hdr-cta` (Liên hệ): thêm `data-sfx="press"` (delegate phát `press` + `glide` đi xuống). Không thêm onClick.
- Logo `#hero`: không cần code (delegate phát `glide` đi lên).
- `.hdr-menu-btn`: thêm `data-sfx="off"`; `onClick={() => { sfx.play(sheetOpen ? 'menuClose' : 'menuOpen', { intensity: 1 }); setSheetOpen((v) => !v); }}`.
- Escape trong effect (dòng ~219–227) hiện gọi `setSheetOpen(false)` mỗi lần nhấn. Thêm `sheetOpenRef` (đồng bộ bằng effect `[sheetOpen]`) và đổi thành `if (sheetOpenRef.current) { sfx.play('menuClose'); setSheetOpen(false); }`. Nếu dropdown cũng đang mở thì `close()` đã phát `menuClose`; throttle 150 ms của engine tự gộp hai lần.
- Link trong sheet (`onClick={() => setSheetOpen(false)}`): giữ nguyên, KHÔNG phát `menuClose` (delegate phát `glide` / `linkOut` / `drop`). `.hdr-sheet-cta`: thêm `data-sfx="press"`.
- Scroll-spy, `is-scrolled`, `is-tucked`, thanh tiến độ: KHÔNG gắn âm.

**4. `CursorDot.tsx` — hover toàn cục (nguồn hover DUY NHẤT cho a/button chung)**
- Trong effect, cạnh `x, y`, khai báo `let lastHit: Element | null = null;`.
- Trong `onMove`, thay dòng `dot.classList.toggle('wide', ...)` bằng:
  `const hit = (e.target as Element).closest?.(INTERACTIVE) ?? null;`
  `dot.classList.toggle('wide', !!hit);`
  `if (hit !== lastHit) { lastHit = hit; if (hit && e.buttons === 0 && !hit.closest('[data-sfx-hover="off"]')) sfx.play('hover', { pan: sfx.panAt(e.clientX) }); }`
- Trong `onLeave` đặt `lastHit = null`. Không phát gì khi rời phần tử. Engine đã throttle nhóm hover 70 ms.

**5. `Modal.tsx` — mở/đóng tập trung (bao mọi đường đóng: X, Escape, backdrop)**
- Thêm `const wasOpen = useRef(false);` và effect:
  `useEffect(() => { if (open && !wasOpen.current) sfx.play('modalOpen'); if (!open && wasOpen.current) sfx.play('modalClose'); wasOpen.current = open; }, [open]);`
- Thêm effect unmount: `useEffect(() => () => { if (wasOpen.current) sfx.play('modalClose'); }, []);` (component bị gỡ khi đang mở).
- Nút X: thêm `data-sfx="off"`. Backdrop là `div` nên delegate không bắt.

**6. `CinematicIntro.tsx`**
- Đổi `finish` thành `finish(skipped: boolean)`, giữ guard `exitingRef`. Sau guard: `sfx.play('swell', skipped ? { intensity: 0.35 } : { intensity: 0.8, source: 'auto' });`. Timer `INTRO_TIMING.complete` gọi `() => finish(false)`. Escape và nút SKIP gọi `finish(true)`. Cập nhật deps của các effect cho đúng.
- Timer từng dòng: `() => { setShown(i + 1); sfx.play('boot', { intensity: line.ok ? 1 : line.sub ? 0.5 : 0.8, source: 'auto' }); }`.
- Timer `access`: `() => { setScene('access'); if (!exitingRef.current) sfx.play('granted', { source: 'auto' }); }`.
- Timer `sweep`: `() => { setSweeping(true); if (!exitingRef.current) sfx.play('whoosh', { intensity: 0.5, rate: 0.8, source: 'auto' }); }`.
- Nút SKIP: không thêm `data-sfx` (delegate phát `tap`, rồi `finish(true)` phát `swell` ngắn).
- Nút "bật âm thanh" mới: `const { enabled, setEnabled } = useSound();` và `const [soundJustOn, setSoundJustOn] = useState(false);`. Render khi `!enabled || soundJustOn`:
  `<button type="button" className="intro-sound" data-sfx="off" aria-pressed={enabled} onClick={() => { if (!enabled) { setEnabled(true); setSoundJustOn(true); window.setTimeout(() => setSoundJustOn(false), 1400); } }}>{enabled ? t.sound.introOn : t.sound.introCta}</button>`
  Đặt cạnh nút SKIP. Nút này KHÔNG gọi `finish`.
- CSS trong `src/index.css` (cạnh style `.intro-skip`): `.intro-sound` đối xứng với `.intro-skip` (cùng font Space Mono, cỡ chữ, màu, letter-spacing, padding, z-index), nằm góc dưới bên TRÁI (`left` bằng giá trị `right` của `.intro-skip`). Thêm chấm emerald 6 px trước chữ (`::before`, `background: #34d399`, `border-radius: 50%`, nhấp nháy opacity 0.4 ↔ 1 trong 1.6 s; tắt nhấp nháy khi reduced motion). Khi `aria-pressed="true"`: chữ màu `#34d399` và `opacity` mờ về 0 trong 1.2 s.

**7. `ContactSection.tsx` — outro**
- Trong effect chứa `frame()`, tạo mốc một lần:
  `const ms = { washStart: milestone(0.03, 0.01), washFull: milestone(0.97, 0.85), pillGrow: milestone(0.02, 0.005), pillLand: milestone(0.99, 0.6), footerIn: milestone(0.95, 0.5) };`
  `let lastP = -1; let synced = false;`
- Trong `frame()`, sau khi tính `p` (đối số truyền vào `outroStages`) và `{ overlay, pill, footer }`:
  - Nếu `!synced`: gọi `sync` cho cả 5 mốc với giá trị hiện tại, `synced = true`, `lastP = p`, rồi bỏ qua phần phát âm ở frame này (tránh bắn khi deep link `#contact` hoặc tải lại giữa trang).
  - `const forward = p > lastP; lastP = p;`
  - Luôn gọi `update(...)` cho cả 5 mốc (để re-arm đúng), nhưng chỉ phát khi `forward`:
    `if (ms.washStart.update(overlay) && forward) sfx.play('swell', { intensity: 1, source: 'auto' });`
    `if (ms.washFull.update(overlay) && forward) sfx.play('reveal', { intensity: 0.7, source: 'auto' });`
    `if (ms.pillGrow.update(pill) && forward) sfx.play('whoosh', { intensity: 0.6, rate: 0.7, pan: 0.4, source: 'auto' });`
    `if (ms.pillLand.update(pill) && forward) { sfx.play('drop', { intensity: 1, pan: 0.3, source: 'auto' }); sfx.play('chime', { delay: 60, pan: 0.3, source: 'auto' }); }`
    `if (ms.footerIn.update(footer) && forward) sfx.play('tick', { step: 0, rate: 0.5, intensity: 0.4, source: 'auto' });`
  - Khi section rời màn hình (IO đặt `visible = false`), đặt `synced = false` để lần vào lại được đồng bộ im lặng.
- Pill CTA `.outro-pill` (mailto): thêm `data-sfx="press"` (delegate phát `press` + `linkOut`).
- Link meta email / GitHub / LinkedIn và nút về đầu trang: không cần code (delegate).
- Heading `WordsPullUp`: không bật âm.

**8. Các file khác của shell**
- `SandTransition.tsx`: KHÔNG gắn âm (work phát `sand` ở CertificationsSection; effect này chạy cả khi tự chuyển).
- `ImageTrail.tsx`: KHÔNG gắn âm (bắn liên tục theo đường chuột, thuần trang trí, chồng với hover).
- `PillButton.tsx` (đang không dùng): thêm `data-sfx="press"` vào phần tử gốc khi là biến thể solid/primary. Không âm cho chuyển động magnetic.
- `LangToggle.tsx` (đang không dùng): `data-sfx="off"` và `sfx.play('lang', { rate: lang === 'vi' ? 1.06 : 0.94 })` trước `toggleLang()`.

**9. Test**: cập nhật test của Navbar / Intro / Contact / Modal nếu markup mới làm vỡ truy vấn (header có thêm một button tên "Âm thanh"; hãy truy vấn theo tên, ví dụ `getByRole('button', { name: 'Chuyển ngôn ngữ' })`, thay vì theo vị trí). Trong jsdom `sfx` không làm gì nên không cần mock; có thể `vi.spyOn(sfx, 'play')` để kiểm tra lời gọi. Chạy `npx tsc -b`, `npx vitest run`, `npx oxlint src`.

### 11.2 story

Phạm vi file: `src/components/HeroSection.tsx`, `src/components/hero/*`, `src/components/AboutSection.tsx`, `src/components/about/*`, `src/components/ExperienceSection.tsx`, `src/components/SkillsSection.tsx`, `src/components/skills/*`, `src/components/ui/TiltCard.tsx`, `src/components/ui/WordsPullUp.tsx`, `src/hooks/useScrollScale.ts`. Import: `import { sfx, milestone } from '../sound'` (từ `src/components/*`) hoặc `'../../sound'` (từ thư mục con). Quy tắc: phần tử tự phát âm khi click có `data-sfx="off"`; phần tử a/button/[role=button] tự có âm hover thì thêm `data-sfx-hover="off"`, và hover tự viết chỉ chạy khi `e.pointerType === 'mouse'`; âm do cuộn / IO / hẹn giờ dùng `source: 'auto'`.

**1. `HeroSection.tsx`**
- Timeout bắt đầu entrance (dòng ~67, nơi `setReady(true)`): sau `setReady(true)`, nếu `!reduced`: `sfx.play('swell', { intensity: 0.7, source: 'auto' }); sfx.play('tick', { step: 7, intensity: 0.6, delay: 1050, source: 'auto' });`.
- Count-up `step()` (dòng ~84–92): giữ mảng `lastShown` (khởi tạo bằng giá trị đầu). Mỗi frame, nếu ít nhất một số hiển thị thay đổi thì gọi MỘT lần `sfx.play('tick', { step: Math.round(p * 4), intensity: 0.35, source: 'auto' })` (engine throttle 45 ms). Khi `p` đạt 1 lần đầu (cờ `doneRef`): `sfx.play('chime', { intensity: 0.5, source: 'auto' })`. Không phát trong cleanup. Nhánh reduced (return sớm) không phát.
- `onReady` của avatar (dòng ~123): `() => { setFigure('ready'); if (readyRef.current) sfx.play('reveal', { intensity: 0.6, source: 'auto' }); }`, với `readyRef` phản ánh `ready` (entrance đã bắt đầu, để không phát sau lớp intro). `onError` im lặng.
- CTA "Xem dự án" (`.hero-glow`, dòng ~233): thêm `data-sfx="press"`. Không thêm onClick.
- "Tải CV", GitHub, link Contact, nút tròn cuộn xuống: KHÔNG cần code (delegate phát `drop` / `linkOut` / `glide`, CursorDot phát hover).

**2. `hero/avatarStage.ts` — xoay avatar như núm vặn có nấc**
- Trong `onMouseMove` (dòng ~106–115), chỉ khi `o.mode === 'scrub'` và stage đang visible (cờ IO ở dòng ~213), sau khi tính `rawTarget` và clamp thành `target`:
  - `const deg = target * 180 / Math.PI` (hoặc dùng đơn vị sẵn có). `const notch = Math.round(deg / 12);`. Nếu `notch !== lastNotch`: `lastNotch = notch; sfx.play('grain', { intensity: 0.25, pan: Math.max(-0.5, Math.min(0.5, deg / 140)), source: 'auto' });`.
  - Chạm biên: `const atLimit = Math.abs(rawTarget) >= TURN_LIMIT;`. Nếu `atLimit && !wasAtLimit`: `sfx.play('bump', { intensity: 0.4, pan: Math.sign(rawTarget) * 0.5, source: 'auto' })`. Sau đó `wasAtLimit = atLimit`.
  - Khởi tạo `lastNotch` bằng nấc của tư thế ban đầu để lần di chuột đầu không phát.
- `useHeroMotion.ts`: KHÔNG gắn âm.

**3. `AboutSection.tsx`**
- `reveal()` (dòng ~189): trong nhánh có canvas, sau `setRevealed(true)` và trước `animateValue`: `sfx.play('swell', { intensity: 0.5, source: 'auto' })`. Nhánh reduced (dòng ~193–196) im lặng. Không thêm tick cho từng fact.
- `onPortalEnter` (dòng ~219): `if (!s.busy && e.pointerType === 'mouse' && performance.now() - lastHum > 600) { lastHum = performance.now(); sfx.play('tick', { step: -5, intensity: 0.4 }); }`. Thêm `data-sfx-hover="off"` lên nút portal.
- Click portal (`travelRef`, dòng ~222–245): thêm `data-sfx="off"` lên nút portal (dòng ~336). Sau `s.busy = true`: `sfx.play('whoosh', { intensity: 1 })`. Trong `.then`, ngay trước `target?.scrollIntoView(...)`: `sfx.suppressAuto(1500); sfx.play('drop', { intensity: 0.8 });`. Nhánh reduced / không canvas (dòng ~225–227): `sfx.suppressAuto(1500); sfx.play('tap');`.
- Danh sách bên (link, dòng ~297): thêm `data-sfx-hover="off"` và `onPointerEnter={(e) => { if (e.pointerType === 'mouse') sfx.play('tick', { step: i, intensity: 0.45 }); }}`. Click do delegate (`glide`).

**4. `WordsPullUp.tsx`**: KHÔNG thêm âm (About đã có `swell`, Contact đã có âm màn trắng). Giữ nguyên file.

**5. `ExperienceSection.tsx`**
- `motion.header` (dòng ~161): `onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}` (viewport đã `once`).
- Nút timeline, trong component cha: `const prevActive = useRef<number | null>(null);` và effect `[active]` debounce 150 ms:
  `const id = window.setTimeout(() => { const prev = prevActive.current; prevActive.current = active; if (prev === null || prev === active) return; if (active > prev) sfx.play('tick', { step: active + 2, intensity: 0.6, source: 'auto' }); else sfx.play('tick', { step: active, intensity: 0.3, rate: 0.5, source: 'auto' }); }, 150); return () => window.clearTimeout(id);`
  Lần mount đầu chỉ ghi `prevActive` (prev là null nên không phát).
- Rail fill (dòng ~153): `const railDone = useRef(milestone(0.995, 0.9));` và `useMotionValueEvent(fill, 'change', (v) => { if (railDone.current.update(v)) sfx.play('chime', { intensity: 0.4, source: 'auto' }); });`. Gọi `railDone.current.sync(fill.get())` một lần khi mount.
- `article` của thẻ (dòng ~84): `onPointerEnter={(e) => { if (e.pointerType === 'mouse') sfx.play('hover', { intensity: 0.6, pan: sfx.panAt(e.clientX) }); }}`. KHÔNG gắn vào `trackSpotlight`.
- Card slide-in, achievements, tags: KHÔNG gắn âm. Index nav (link): delegate + CursorDot, không cần code.

**6. `SkillsSection.tsx` — phim cuộn ghim**
- Trong effect chứa `update()`, tạo mốc một lần:
  `const marks = [`
  `  { m: milestone(600, 450), play: () => sfx.play('whoosh', { intensity: 0.6, rate: 0.9, source: 'auto' }) },`
  `  { m: milestone(1350, 1200), play: () => sfx.play('whoosh', { intensity: 0.8, rate: 1.25, source: 'auto' }) },`
  `  { m: milestone(1800, 1650), play: () => sfx.play('chime', { rate: 0.5, intensity: 0.6, source: 'auto' }) },`
  `  { m: milestone(2800, 2650), play: () => sfx.play('whoosh', { intensity: 0.6, pan: 0.4, source: 'auto' }) },`
  `];`
  `let prevSmooth = 0; let prevReady = false;`
- Sau `computeFrame(...)` (dòng ~85):
  - Nếu frame này là snap (nhánh `initialized === false` ở dòng ~79) hoặc đang reduced / `still`: `marks.forEach((k) => k.m.sync(smooth)); prevReady = controlsReady; prevSmooth = smooth;` và không phát gì.
  - Ngược lại: `const fired = marks.filter((k) => k.m.update(smooth));`. Nếu `smooth > prevSmooth && fired.length > 0 && Math.abs(smooth - prevSmooth) < 220` thì chỉ phát `fired[fired.length - 1].play()` (gộp burst). Sau đó `prevSmooth = smooth`.
- `controlsReady` (dòng ~94), cũng trong nhánh không-snap: `if (controlsReady && !prevReady) sfx.play('tap', { rate: 0.8, intensity: 0.6, source: 'auto' }); prevReady = controlsReady;`.
- Ô công nghệ trên vòng cung (`li`, dòng ~226): `onPointerEnter={(e) => { if (e.pointerType === 'mouse' && smoothRef.current < 900) sfx.play('tick', { step: i, intensity: 0.5, pan: sfx.panAt(e.clientX) }); }}`. Cần `smoothRef` (ref số) được `update()` ghi mỗi frame; không đọc layout.
- CTA bảo mật (dòng ~296): thêm `data-sfx="press"`. Không phát trong `onFocus` / `scrollToStop`.
- Prev / Next (dòng ~348 / ~356): thêm `data-sfx="off"`. Trong onClick, trước `move(dir)`: `sfx.play('slide', { intensity: 1, pan: dir * 0.4, rate: dir > 0 ? 1.04 : 0.96 })`. KHÔNG dùng effect theo `active` (`jump()` / `normalize()` đổi `active` im lặng).
- Chọn thẻ (onClick dòng ~323 và `onCardKey` Enter/Space dòng ~161–166): gom vào `select(index)`: `sfx.play(index === active ? 'tap' : 'slide', { pan: Math.sign(index - active) * 0.4 }); setActive(index);`. Thêm `data-sfx="off"` lên phần tử thẻ có onClick. Hover thẻ thật (`real === true`): nếu thẻ là `[role=button]` thì CursorDot đã lo; nếu không thì `onPointerEnter` (mouse) → `sfx.play('hover', { intensity: 0.7, pan: sfx.panAt(e.clientX) })`.
- Pointer parallax, IO snap: KHÔNG gắn âm.

**7. `TiltCard.tsx`** (đang không dùng): `handleMouseEnter` → `sfx.play('hover', { intensity: 0.6 })`. Không gắn vào `handleMouseMove`.

**8. `useScrollScale.ts`**: KHÔNG gắn âm.

**9. Test**: jsdom làm `sfx` thành no-op, không cần mock. Có thể `vi.spyOn(sfx, 'play')` để kiểm tra (ví dụ prev/next phát `slide` với pan đúng dấu). Chạy `npx tsc -b`, `npx vitest run`, `npx oxlint src`.

### 11.3 work

Phạm vi file: `src/components/archive/*`, `src/components/ProjectsSection.tsx`, `src/components/ProjectDetailModal.tsx`, `src/components/ui/ProjectGallery.tsx`, `src/components/artifacts/*` (`ArtifactAtlas.tsx`, `stage.ts`, `atlas.css`), `src/components/CertificationsSection.tsx`, `src/components/ui/TechTag.tsx`, `src/components/ui/SurfaceCard.tsx`, `src/components/ui/LiquidGlassCard.tsx`. Import: `import { sfx } from '../sound'` (từ `src/components/*`) hoặc `'../../sound'` (từ thư mục con). Quy tắc: phần tử tự phát âm khi click có `data-sfx="off"`; phần tử a/button/[role=button]/[data-shot] tự có âm hover thì thêm `data-sfx-hover="off"`, và hover tự viết chỉ chạy khi `e.pointerType === 'mouse'`; âm do cuộn / IO / hẹn giờ / tải xong dùng `source: 'auto'`. Âm mở/đóng modal nằm trong `ui/Modal.tsx` (shell); KHÔNG phát `modalOpen` / `modalClose` ở đây.

**1. `archive/ArchiveSphere.tsx`**
- IO reveal (dòng ~167–175): thêm `revealedRef`. Lần đầu `setRevealed(true)` thì `sfx.play('swell', { intensity: 0.45, delay: 700, source: 'auto' })`.
- Thêm `data-sfx-hover="off"` lên `.archive-stage` (ảnh tự trôi dưới con trỏ, không phát hover).
- Bắt đầu kéo thật: trong `onPointerMove` (dòng ~218–243), lần đầu `moved >= clickSlop` khi đang dragging (và nhánh touch khi pending chuyển sang dragging, dòng ~232–234): đặt `dragAnnounced = true` và `sfx.play('tap', { rate: 0.7, intensity: 0.4 })`. Reset cờ ở pointerup / pointercancel.
- Quay: trong `frame()` (dòng ~109–157), dùng vận tốc kéo/quán tính (KHÔNG cộng `IDLE_SPIN`): `const speed = Math.hypot(velX, velY);`. Nếu `speed > 0.25 && !openRef.current && visible`: `sfx.play('grain', { intensity: Math.min(1, speed / 6), pan: Math.max(-0.5, Math.min(0.5, velX / 6)) })`. Engine tự throttle theo cường độ, gọi mỗi frame là an toàn. Có thể bỏ qua cả khối khi `!sfx.ready()`.
- Thả (dòng ~245–261): `if (!wasClick) { const sp = Math.hypot(velX, velY); if (sp > 0.3) sfx.play('whoosh', { intensity: Math.min(0.6, Math.max(0.2, sp / 8)), pan: Math.max(-0.5, Math.min(0.5, velX / 6)) }); }`. `onPointerCancel` không phát.
- Chọn ảnh (nhánh `if (downCard)`, trước `setSelection`, dòng ~253–258): `sfx.play('chime', { step: projectIndex, intensity: 0.4, pan: sfx.panAt(e.clientX) })`.
- Dolly theo cuộn, idle spin, `img onLoad`: KHÔNG gắn âm. Link "Xem dạng danh sách": delegate (`glide`), không cần code.

**2. `ProjectsSection.tsx`**
- `motion.header` (dòng ~242): `onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}` (viewport `once`).
- `.gradient-ring-btn` (dòng ~260): thêm `data-sfx="press"` (delegate phát `press` + `glide`).
- FeaturedStage `show()` (dòng ~53–63): đổi thành `show(index: number, user = false)`. Sau guard (cooling / cùng index), nếu `user`: `sfx.play('tick', { step: index + 2, intensity: 0.7 }); sfx.play('slide', { intensity: 0.5, pan: Math.sign(index - active) * 0.3 });`. Nút 01/02/03 (dòng ~138) gọi `show(i, true)` và có `data-sfx="off"`. Vòng tự động 5.2 s (dòng ~77) gọi `show(next)` → im lặng.
- Nút "Chi tiết" (dòng ~124) và `.bento-hit` (dòng ~216–221): thêm `data-sfx="off"` (chỉ nghe `modalOpen` từ Modal).
- Hover thẻ bento (`article.bento-card`, dòng ~171): thêm `data-sfx-hover="off"` và `onPointerEnter={(e) => { if (e.pointerType === 'mouse') sfx.play('hover', { intensity: 0.8, rate: 0.85, pan: sfx.panAt(e.clientX) }); }}`. Không phát hover khi focus bằng bàn phím.
- FeaturedStage `whileInView`, `useScrollScale`: KHÔNG gắn âm.

**3. `ProjectDetailModal.tsx`**: KHÔNG cần code. Link ngoài (`target=_blank`) do delegate phát `linkOut`.

**4. `ui/ProjectGallery.tsx`**
- Gom `go(delta: 1 | -1, repeat = false)`: `setIndex((index + delta + count) % count); if (!repeat || performance.now() - lastStep.current > 120) { lastStep.current = performance.now(); sfx.play('slide', { intensity: 0.45, pan: delta * 0.3, rate: delta > 0 ? 1.05 : 0.95 }); }`. Dùng cho nút prev (dòng ~52), next (dòng ~60) và `handleKeyDown` ArrowLeft / ArrowRight (dòng ~22–25, truyền `e.repeat`).
- Nút prev / next: `data-sfx="off"`.
- Thumbnail (dòng ~83): `data-sfx="off"`; `onClick={() => { if (i !== index) { sfx.play('tick', { step: i, intensity: 0.5, pan: count > 1 ? (i / (count - 1)) * 0.6 - 0.3 : 0 }); setIndex(i); } }}`.
- `motion.img` / AnimatePresence: KHÔNG gắn âm.

**5. `artifacts/ArtifactAtlas.tsx`**
- Đưa `active` và trạng thái on-screen vào ref (`activeRef`, `onScreenRef`) nếu chưa có.
- `onLoadState` (dòng ~96–97): `if (state === 'ready' && index === activeRef.current && onScreenRef.current) sfx.play('chime', { rate: 0.84, intensity: 0.6, source: 'auto' })`. Lỗi: im lặng.
- `select(index)` (dòng ~141): sau guard: `const now = performance.now(); if (now - lastSwitch.current > 250) { lastSwitch.current = now; const dir = Math.sign(index - prev); sfx.play('slide', { intensity: 0.8, pan: dir * 0.35, rate: dir > 0 ? 1.05 : 0.95 }); sfx.play('chime', { step: index + 3, intensity: 0.4, delay: 480 }); }`. Thêm `data-sfx="off"` lên item sidebar chọn hiện vật (dòng ~212, nếu là button), tab (dòng ~265), prev / next (dòng ~365 / ~368).
- Zoom in / out (dòng ~305 / ~314): `data-sfx="off"`. Đọc zoom đích trước và sau `zoomBy(...)` (thêm getter `getZoomTarget()` vào engine nếu chưa có). Đổi được → `sfx.play('slide', { intensity: 0.35, rate: zoomIn ? 1.2 : 0.8 })`. Không đổi (đã ở biên) → `sfx.play('bump', { intensity: 0.6 })`. Gọi `zoomBy(..., { silent: true })` để detent trong `stage.ts` không phát chồng (xem mục 6).
- Focus (nút dòng ~323, effect `[focus]` dòng ~133–139): nút `data-sfx="off"`. Effect riêng bỏ qua lần mount đầu (ref): `sfx.play('whoosh', focus ? { intensity: 0.7, rate: 0.85 } : { intensity: 0.35, rate: 1.15 })`. Bao cả nút lẫn Escape.
- Ngày / Đêm (nút dòng ~332, effect `[light]` dòng ~128–131): nút `data-sfx="off"`. Effect riêng bỏ qua lần đầu: `light === 'day' ? sfx.play('toggleOn', { rate: 1.12 }) : sfx.play('toggleOff', { rate: 0.84 })`.
- Xoay (dòng ~339 / ~342 / ~345): `data-sfx="off"`, throttle 150 ms bằng ref. 90°: `sfx.play('slide', { intensity: 0.5, pan: sign * 0.35 })`. 360°: `sfx.play('whoosh', { intensity: 0.6 }); sfx.play('chime', { intensity: 0.35, delay: 1100 });`.
- Cận cảnh (dòng ~414): `data-sfx="off"`; `closeUp ? sfx.play('slide', { rate: 0.85, intensity: 0.4 }) : sfx.play('reveal', { intensity: 0.6 })`. Gọi `setZoom(..., { silent: true })`.
- Link sidebar `#projects`, Tour VR, case study (dòng ~198 / ~224 / ~241): KHÔNG cần code (delegate `glide` / `linkOut`).

**6. `artifacts/stage.ts`** (import `sfx` trực tiếp; đặt mọi lời gọi sau `if (sfx.ready())` để không tốn chi phí khi tắt)
- `pointerdown` (dòng ~411–422), sau `this.engaged = true` và chỉ khi `pointers.size === 1`: `sfx.play('tap', { rate: 1.3, intensity: 0.35 })`.
- `frame()` quán tính (dòng ~549–557): `const speed = Math.hypot(this.velX, this.velY);` (rad/s). Nếu `speed > 0.4`: `sfx.play('grain', { intensity: Math.min(1, speed / 8), rate: 1.4, pan: Math.max(-0.5, Math.min(0.5, this.velX / 8)) })`. KHÔNG phát cho idle sway / bob.
- `setZoom(value, opts?: { silent?: boolean })` (dòng ~246–250), và `zoomBy` chuyển `opts` xuống: giữ `lastNotch`, `lastDetentAt`, `wasAtEdge`. Khi `!opts?.silent`: `const notch = Math.floor(Math.log(this.zoomTarget) / 0.12); if (notch !== lastNotch && now - lastDetentAt > 83) { sfx.play('tick', { step: notch + 5, intensity: 0.4 }); lastDetentAt = now; }`. Chạm biên (giá trị bị clamp về `ZOOM_MIN` / `ZOOM_MAX` và lần trước chưa ở biên): `sfx.play('bump', { intensity: 0.5 })` một lần. Luôn cập nhật `lastNotch` và `wasAtEdge` kể cả khi silent. Áp dụng cho wheel, pinch và phím +/-.
- `resetView()` (dòng ~259–264): `sfx.play('glide', { intensity: 0.3, rate: 1.1 })`. Khi homing xong (dòng ~570, `this.homing = false`): `sfx.play('tick', { step: 5, intensity: 0.5 })`.
- Phím mũi tên trên stage (khối `if (handled)`, dòng ~509–513): với ←/→/↑/↓, nếu `!e.repeat || now - lastNudge > 90`: `sfx.play('tick', { step: positive ? 4 : 2, intensity: 0.4, pan: horizontalSign * 0.3 })`. Phím `0` đi qua `resetView`. Phím +/- đi qua `setZoom` (detent).
- Model tải nền (không active): KHÔNG phát.

**7. `CertificationsSection.tsx`**
- Nút chứng chỉ (dòng ~160–168): thêm `data-sfx="off"`; trong onClick: `if (i !== active) sfx.play('sand');` trước `setActive(i)`. Bấm lại mục đang active: im lặng. Vòng tự động 5 s (dòng ~54): im lặng.
- `motion.p` statement (dòng ~65): `onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}` (viewport `once`).
- Nút "Xác thực" `.cert-verify` (dòng ~234): thêm `data-sfx="off"` và `onClick={() => { sfx.play('drop', { intensity: 0.7 }); sfx.play('chime', { delay: 70, intensity: 0.6 }); }}` (không `preventDefault`). Hover: CursorDot lo.
- Hover tên chứng chỉ: CursorDot lo (là button), không cần code.

**8. `TechTag.tsx`, `SurfaceCard.tsx`, `LiquidGlassCard.tsx`**: KHÔNG gắn âm (thuần trình bày; `SurfaceCard` có onMouseMove liên tục).

**9. Test**: jsdom làm `sfx` thành no-op. Có thể `vi.spyOn(sfx, 'play')` (ví dụ: gallery next phát `slide` với pan dương; click chứng chỉ khác phát `sand`, mục active không phát). Chạy `npx tsc -b`, `npx vitest run`, `npx oxlint src`.

---

## Phụ lục — Bản 2: âm dễ nghe hơn và thêm hiệu ứng (08/10/2026)

### Đổi chất liệu: từ "kính + noise" sang nhạc cụ mềm

Đo phổ từng âm (render offline, cửa sổ Hann 2048 mẫu) cho thấy nhiều âm dựa vào noise dải cao nghe "xì": `grain` có 44,6% năng lượng trên 4 kHz, `menuClose` 18,8%, `linkOut` 15,9%, `modalClose` 14,4%, `slide` 11,4%. `hover` chỉ dài 34 ms nên tai nghe như tiếng "tách" chứ không có cao độ.

Bản 2 dựng mọi âm từ bốn "nhạc cụ" dùng chung trong `voices.ts`:

| Nhạc cụ | Cấu tạo | Dùng cho |
|---|---|---|
| `pluck` (kalimba/marimba) | sine thân âm hơi cao rồi về đúng nốt, partial ×4 tắt nhanh, tiếng dùi lowpass 1,4 kHz, onset 3 ms, cả cụm qua lowpass | hover, tap, press, tick, toggle, lang, menu, slide, focus, success, mail, download, rise |
| `pad` (electric piano mềm) | sine + triangle lệch 7 cent, gảy lần lượt (strum), lowpass ~2 kHz | press, glide, whoosh, granted, section |
| `air` (hơi thở) | noise bandpass Q 0,55 quét, luôn qua lowpass 2,4 kHz | menu, modal, slide, glide, whoosh, lang, mail, rise |
| `bell` (chuông bạc dịu) | FM chỉ số 1,2×fc tắt trong 0,35 s, onset 4 ms | modalOpen, chime, success, granted, sand |

Thay sóng vuông bằng sine/triangle (`bump` thành tiếng mõ gỗ; `boot` thành chuỗi phím gõ mềm 3-5 tiếng + nốt "ok"). `swell` đổi sawtooth sang triangle.

Kết quả đo sau khi sửa: mọi âm ≤ 2,2% năng lượng trên 4 kHz (grain 0%, menuClose 0,2%, linkOut 0%); centroid giảm (menuClose 2867 → 870 Hz, slide 2410 → 656 Hz, grain 4288 → 1124 Hz). Âm lượng tổng `MASTER_DB` = −11 dB.

### Âm mới (24 → 30 id)

| id | Khi nào | Âm |
|---|---|---|
| `section` | khách **tự cuộn** (wheel/touch/phím) và một section chạm dải giữa màn hình | hợp âm riêng cho từng section, gảy nhẹ; cả trang là một chuỗi hợp âm D Lydian kết về D6/9 ở Contact (`SECTION_CHORDS`) |
| `focus` | chuyển focus bằng Tab / Shift+Tab | nốt kalimba rất nhỏ, đi lên/xuống thang ngũ cung |
| `success` | copy chữ (sự kiện `copy`) | quãng 4 đi lên + chuông nhỏ |
| `mail` | link `mailto:` / `tel:` | tiếng giấy lướt + hai nốt |
| `download` | link có `download` (Tải CV) | ba nốt đi xuống rồi "đáp" nhẹ |
| `rise` | link `#hash` đưa về đầu trang | chạy thang ngũ cung đi lên + hơi thở |

`section`, `focus`, `success` nằm trong `src/sound/extras.ts` (gắn một lần trong `engine.install()`), không cần sửa component. `section` không phát khi nhảy bằng link (chỉ phát trong 1,5 s sau thao tác cuộn của khách, và `source: 'auto'` nên bị `suppressAuto` của `glide` chặn), không lặp lại section vừa phát, và bị tắt khi `prefers-reduced-motion`.
