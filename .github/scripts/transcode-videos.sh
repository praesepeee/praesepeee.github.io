#!/usr/bin/env bash
# =============================================================================
# 视频转码 —— 在 GitHub Actions 里把 content/ 下的视频统一转成浏览器能播的格式
#
#   为什么需要：手机（尤其 iPhone / 安卓）拍出来的视频默认是 HEVC / H.265，
#   Chrome、Edge、Firefox 桌面端在 Windows 上解不了，页面上就是一块黑屏。
#   转成 H.264 + AAC 之后全平台都能直接播。
#
#   目标编码：
#     mp4 / m4v / mov / mkv / avi / 3gp / wmv / flv  →  H.264 + AAC（+ faststart）
#     webm                                          →  VP9 + Opus
#
#   转码结果**写回原文件**，文件名不变，所以 Markdown 里的引用不用改。
#
# 用法：
#   bash .github/scripts/transcode-videos.sh            # 转码（带缓存）
#   bash .github/scripts/transcode-videos.sh --hash     # 只打印视频指纹（给 actions/cache 当 key）
#
# 可调环境变量：
#   VIDEO_SRC_DIR    扫描目录，默认 content
#   VIDEO_CACHE_DIR  转码缓存目录，默认 .cache/transcoded（记得加进 .gitignore）
#   MAX_HEIGHT       最大高度，默认 1080；只在超过时才缩，不会把小视频放大
#   CRF              H.264 质量，默认 23（18 更清晰，28 更小）
#   PRESET           编码速度，默认 veryfast（慢一点可换 medium，体积更小）
#   FORCE            设为 1 忽略缓存强制重转
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SRC_DIR="${VIDEO_SRC_DIR:-content}"
CACHE_DIR="${VIDEO_CACHE_DIR:-.cache/transcoded}"
MAX_HEIGHT="${MAX_HEIGHT:-1080}"
CRF="${CRF:-23}"
PRESET="${PRESET:-veryfast}"
FORCE="${FORCE:-0}"
HASH_FILE="$CACHE_DIR/.hash"

EXTS=(mp4 m4v mov mkv webm avi 3gp wmv flv)

log()  { printf '▶ %s\n' "$*"; }
warn() { printf '::warning::%s\n' "$*"; }
err()  { printf '::error::%s\n' "$*"; }

# ---------------------------------------------------------------- 收集视频文件
VIDEOS=()
collect_videos() {
  local args=("$SRC_DIR" -type f '(') e first=1
  for e in "${EXTS[@]}"; do
    [ "$first" -eq 1 ] && first=0 || args+=(-o)
    args+=(-iname "*.$e")
  done
  args+=(')' -print0)
  [ -d "$SRC_DIR" ] || return 0
  while IFS= read -r -d '' f; do VIDEOS+=("$f"); done < <(find "${args[@]}" | sort -z)
}

# ------------------------------------------------------- 指纹（路径 + 字节数）
# 用路径 + 体积而不是全内容哈希：几个 G 的视频每次都算一遍太慢，
# 而「同名同大小」基本等价于「同一个文件」。
compute_hash() {
  [ "${#VIDEOS[@]}" -gt 0 ] || { printf 'none'; return 0; }
  local f
  for f in "${VIDEOS[@]}"; do printf '%s %s\n' "$f" "$(stat -c '%s' "$f")"; done \
    | sha1sum | cut -c1-16
}

# ------------------------------------------------------------------- ffprobe
probe() { ffprobe -v error -select_streams "$1" -show_entries "$2" \
            -of default=nw=1:nk=1 "$3" 2>/dev/null | head -n1 || true; }

ext_of() { local e="${1##*.}"; printf '%s' "$(printf '%s' "$e" | tr '[:upper:]' '[:lower:]')"; }
mib()    { printf '%s' "$(du -m "$1" 2>/dev/null | cut -f1)"; }

ensure_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then return 0; fi
  log "安装 ffmpeg …"
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
  else
    apt-get update -qq && apt-get install -y -qq ffmpeg
  fi
}

# ----------------------------------------------- 已经是浏览器能直接播的组合吗
is_playable() {
  local ext="$1" v="$2" a="$3"
  case "$ext" in
    webm)
      case "$v" in vp8|vp9|av1) ;; *) return 1 ;; esac
      if [ -n "$a" ]; then case "$a" in opus|vorbis) ;; *) return 1 ;; esac; fi
      ;;
    *)
      [ "$v" = "h264" ] || return 1
      if [ -n "$a" ]; then [ "$a" = "aac" ] || return 1; fi
      ;;
  esac
  return 0
}

# ------------------------------------------------------------------ 单个转码
# 转码结果写到 $2（临时文件），由调用方决定放回哪里
process_one() {
  local src="$1" out="$2"
  local ext v a h
  ext="$(ext_of "$src")"
  v="$(probe v:0 stream=codec_name "$src")"
  a="$(probe a:0 stream=codec_name "$src")"
  h="$(probe v:0 stream=height "$src")"

  if [ -z "$v" ]; then warn "读不出视频流，原样保留：$src"; cp -f "$src" "$out"; return 0; fi

  local vf=()
  if [ -n "$h" ] && [ "$h" -gt "$MAX_HEIGHT" ] 2>/dev/null; then
    vf=(-vf "scale=-2:$MAX_HEIGHT")
  fi

  if is_playable "$ext" "$v" "$a"; then
    if [ "$ext" = "webm" ]; then
      cp -f "$src" "$out"                       # webm 没有 faststart 一说，直接沿用
    else
      # 编码没问题，只重封装一次把索引挪到文件头（边下边播），几乎不耗时
      ffmpeg -y -hide_banner -loglevel error -i "$src" -c copy -movflags +faststart "$out" \
        || cp -f "$src" "$out"
    fi
    return 0
  fi

  log "转码 $(basename "$src")（$v → $( [ "$ext" = webm ] && echo vp9 || echo h264 )${a:+ / $a})"
  if [ "$ext" = "webm" ]; then
    ffmpeg -y -hide_banner -loglevel error -i "$src" "${vf[@]}" \
      -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -deadline good -cpu-used 4 -pix_fmt yuv420p \
      -c:a libopus -b:a 96k -ac 2 \
      "$out"
  else
    ffmpeg -y -hide_banner -loglevel error -i "$src" "${vf[@]}" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$CRF" -preset "$PRESET" \
      -c:a aac -b:a 128k -ac 2 \
      -movflags +faststart -map_metadata 0 -sn -dn \
      "$out"
  fi
}

# ---------------------------------------------------------------------- 主流程
main() {
  collect_videos
  local hash; hash="$(compute_hash)"

  if [ "$1" = "--hash" ]; then printf '%s' "$hash"; return 0; fi

  mkdir -p "$CACHE_DIR"
  if [ "${#VIDEOS[@]}" -eq 0 ]; then
    log "没有找到视频，跳过转码"
    printf '%s' "$hash" > "$HASH_FILE"
    return 0
  fi

  if [ "$FORCE" != "1" ] && [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE")" = "$hash" ]; then
    log "命中转码缓存，直接还原 ${#VIDEOS[@]} 个视频"
    local f
    for f in "${VIDEOS[@]}"; do
      if [ -f "$CACHE_DIR/$f" ]; then cp -f "$CACHE_DIR/$f" "$f"; fi
    done
    printf '%s' "$hash" > "$HASH_FILE"
    return 0
  fi

  ensure_ffmpeg
  log "开始处理 ${#VIDEOS[@]} 个视频（上限 ${MAX_HEIGHT}p，CRF ${CRF}）"

  local f tmp before after rows=()
  for f in "${VIDEOS[@]}"; do
    # 临时文件放在**源文件旁边**而不是 /tmp：
    #   1. ffmpeg 靠后缀决定封装格式，后缀必须保留；
    #   2. 同盘 mv 是原子的、也快，跨盘就要整份拷贝
    tmp="$(dirname "$f")/.transcode-$(basename "$f")"
    before="$(mib "$f")"
    if process_one "$f" "$tmp"; then
      mv -f "$tmp" "$f"
    else
      err "转码失败，保留原文件：$f"
    fi
    rm -f "$tmp"
    after="$(mib "$f")"
    rows+=("| $(basename "$f") | ${before} MB | ${after} MB |")
    mkdir -p "$CACHE_DIR/$(dirname "$f")"
    cp -f "$f" "$CACHE_DIR/$f"
  done

  printf '%s' "$hash" > "$HASH_FILE"

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      echo "### 视频转码"
      echo ""
      echo "| 文件 | 转码前 | 转码后 |"
      echo "| --- | --- | --- |"
      printf '%s\n' "${rows[@]}"
    } >> "$GITHUB_STEP_SUMMARY"
  fi
  log "转码完成"
}

main "${1:-}"
