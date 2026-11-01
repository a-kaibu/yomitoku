---
title: "mkdir が「一度に 1 人しか成功しない」ことを使ったロック"
description: "同じバージョンの同時インストールを防ぐ関数。mkdir が原子的に動くことを利用してロックを取り、古いロックの自動削除やタイムアウトも備えている。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [4423, 4469]
function: "nvm_acquire_install_lock"
difficulty: 3
format: 2
tags: [並行処理, ファイル, 防御的プログラミング]
---
## ひとことで

`nvm_acquire_install_lock VERSION` は、同じバージョンの Node.js を **2 つのターミナルから同時にインストールしないように** するための「ロック」を取る関数です。ロックが取れたら成功を返し、ほかのインストールが終わるまでは 1 秒ずつ待ちます。

ロックの正体は **ディレクトリ** です。`mkdir` でディレクトリを作れた人がロックを持ち、作れなかった人は待つ、というシンプルな仕組みです。

## コード

::: code-group

```sh:line-numbers=4423 [日本語訳]
nvm_acquire_install_lock() {
  local VERSION
  VERSION="${1-}"
  if [ -z "${VERSION}" ]; then
    return 0
  fi

  local LOCK_ROOT
  LOCK_ROOT="$(nvm_cache_dir)/locks"
  # ロック用のディレクトリを作れなくても、それを理由にインストールを止めない。
  command mkdir -p "${LOCK_ROOT}" 2>/dev/null || return 0

  local LOCK
  LOCK="${LOCK_ROOT}/$(nvm_install_lock_name "${VERSION}")"

  local TIMEOUT
  TIMEOUT="${NVM_INSTALL_LOCK_TIMEOUT:-600}"
  local STALE
  STALE="${NVM_INSTALL_LOCK_STALE:-0}"

  local WAITED
  WAITED=0
  local ANNOUNCED
  ANNOUNCED=0
  while ! command mkdir "${LOCK}" 2>/dev/null; do
    # 異常終了したインストールが残したロックは、十分古くなったら奪う。
    if [ "${STALE}" != '0' ] && [ -n "$(command find "${LOCK}" -maxdepth 0 -type d -mmin "+${STALE}" 2>/dev/null)" ]; then
      nvm_err "Removing stale install lock for ${VERSION} (older than ${STALE} minute(s))"
      command rm -rf "${LOCK}" 2>/dev/null
      continue
    fi
    if [ "${WAITED}" -ge "${TIMEOUT}" ]; then
      nvm_err "Timed out after ${TIMEOUT}s waiting for another install of ${VERSION} to finish."
      nvm_err "If no other install is running, remove ${LOCK} and try again."
      return 1
    fi
    if [ "${ANNOUNCED}" -eq 0 ]; then
      nvm_err "Waiting for another install of ${VERSION} to finish..."
      ANNOUNCED=1
    fi
    command sleep 1
    WAITED=$((WAITED + 1))
  done

  NVM_INSTALL_LOCK="${LOCK}"
  return 0
}
```

```sh:line-numbers=4423 [原文]
nvm_acquire_install_lock() {
  local VERSION
  VERSION="${1-}"
  if [ -z "${VERSION}" ]; then
    return 0
  fi

  local LOCK_ROOT
  LOCK_ROOT="$(nvm_cache_dir)/locks"
  # If the lock directory can't be created, don't block the install over it.
  command mkdir -p "${LOCK_ROOT}" 2>/dev/null || return 0

  local LOCK
  LOCK="${LOCK_ROOT}/$(nvm_install_lock_name "${VERSION}")"

  local TIMEOUT
  TIMEOUT="${NVM_INSTALL_LOCK_TIMEOUT:-600}"
  local STALE
  STALE="${NVM_INSTALL_LOCK_STALE:-0}"

  local WAITED
  WAITED=0
  local ANNOUNCED
  ANNOUNCED=0
  while ! command mkdir "${LOCK}" 2>/dev/null; do
    # Steal a lock left behind by a crashed install once it is old enough.
    if [ "${STALE}" != '0' ] && [ -n "$(command find "${LOCK}" -maxdepth 0 -type d -mmin "+${STALE}" 2>/dev/null)" ]; then
      nvm_err "Removing stale install lock for ${VERSION} (older than ${STALE} minute(s))"
      command rm -rf "${LOCK}" 2>/dev/null
      continue
    fi
    if [ "${WAITED}" -ge "${TIMEOUT}" ]; then
      nvm_err "Timed out after ${TIMEOUT}s waiting for another install of ${VERSION} to finish."
      nvm_err "If no other install is running, remove ${LOCK} and try again."
      return 1
    fi
    if [ "${ANNOUNCED}" -eq 0 ]; then
      nvm_err "Waiting for another install of ${VERSION} to finish..."
      ANNOUNCED=1
    fi
    command sleep 1
    WAITED=$((WAITED + 1))
  done

  NVM_INSTALL_LOCK="${LOCK}"
  return 0
}
```

:::

## 前提知識

- **ロック**: 複数のプログラムが同じものを同時に触らないようにする仕組みです。先にロックを取ったほうだけが作業し、ほかは待ちます。
- **`mkdir` の原子性**: `mkdir` は「ディレクトリが無ければ作って成功、あれば失敗」を **一度に** 行います。2 つのプロセスが同時に `mkdir` しても、成功するのは必ず 1 つだけです。この性質を **原子的（アトミック）** といいます。
- **`mkdir -p`**: 途中のディレクトリもまとめて作り、すでにあっても失敗しません。
- **`while ! コマンド; do ... done`**: コマンドが **失敗している間** 繰り返します。
- **`find パス -maxdepth 0 -type d -mmin +N`**: そのディレクトリの更新時刻が N 分より前なら、パスを表示します。
- **`continue`**: ループの残りを飛ばして、条件の判定に戻ります。
- **`${VAR:-600}`**: 変数が空なら 600 を使います。

## 何をしているか

### 1. 準備

バージョンが空なら何もしません。ロック用のディレクトリ `~/.nvm/.cache/locks` を作ります。作れなければ、ロックのせいでインストールが止まるのは本末転倒なので、ロックなしで進めます。

待つ上限（既定 600 秒）と、古いロックとみなす時間（既定 0 = 無効）を決めます。

### 2. mkdir できるまで待つ

`mkdir` に成功すればループを抜けます。失敗した（ほかの誰かがロックを持っている）ときは、次のことをします。

- 古いロックの設定があり、ロックが設定した分数より古ければ、前のインストールが異常終了して残ったものとみなして削除し、すぐにやり直します。
- 待ち時間が上限を超えたら、手動で消す方法を案内して失敗を返します。
- 最初の 1 回だけ「待っています」と表示します。
- 1 秒待って、待ち時間を 1 増やします。

### 3. ロックを記録

取ったロックの場所を `NVM_INSTALL_LOCK` に保存します。インストールが終わると `nvm_release_install_lock` がこのディレクトリを消します。

## ここがすごい

- **ファイルシステムをロックに使う**: シェルには専用のロック機能がありません。`flock` コマンドは Linux にはあっても macOS には標準で入っていません。`mkdir` の原子性はどの OS でも成り立つので、どこでも同じように使えます。
- **「確認してから作る」をしない**: `[ -d "$LOCK" ] || mkdir "$LOCK"` のように確認と作成を分けると、その間に別のプロセスが割り込めてしまいます（競合状態）。`mkdir` 1 回で判定と作成を同時に行うのが正解です。
- **異常時の逃げ道を用意**: 古いロックの自動削除、タイムアウト、ロックを作れないときの続行と、ロックが原因で永久に止まらないようにしています。
- **メッセージは 1 回だけ**: 待つたびに表示すると画面が埋まるので、フラグで 1 回に抑えています。

## まとめ

- `mkdir` は原子的なので、シェルスクリプトで手軽なロックとして使える。
- 「確認してから作る」の 2 段階は競合状態を生むので、1 回の操作で済ませる。
- ロックには、タイムアウトや古いロックの処理など、止まりっぱなしにならない仕組みを付ける。
