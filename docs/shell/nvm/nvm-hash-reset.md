---
title: "コマンドの場所の記憶をシェルごとに安全に消す"
description: "PATH を変えた後にシェルが覚えているコマンドの場所を忘れさせる hash -r を、bash や ksh93 の落とし穴を避けながら実行する関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1577, 1588]
function: "nvm_hash_reset"
difficulty: 2
format: 2
tags: [移植性, 防御的プログラミング]
---
## ひとことで

`nvm_hash_reset` は、シェルが覚えている「コマンドの場所」の記憶（ハッシュテーブル）を消す関数です。中身は基本的に `hash -r` を 1 回実行するだけですが、シェルによってはこれがエラーになるので、その場合は何もせずに終わります。

`nvm use 20` で PATH を書き換えても、シェルが「`node` は `/home/me/.nvm/.../v18/bin/node` にある」と覚えたままだと、古い `node` が動いてしまいます。それを防ぐのがこの関数です。

## コード

::: code-group

```sh:line-numbers=1577 [日本語訳]
nvm_hash_reset() {
  # `set +h` のときは消すキャッシュが無く、`hash -r` はエラーになる
  if [ -n "${BASH_VERSION-}" ] && [ "${-#*h}" = "$-" ]; then
    return 0
  fi
  # `ksh93` の `hash` は `-r` を受け付けず、使い方の誤りが致命的なエラーになる。
  # サブシェルで試せば被害はそこで止まり、`-r` を受け付ける `ksh` の種類では普通に実行できる
  if [ -n "${KSH_VERSION-}" ] && ! ( \hash -r ) >/dev/null 2>&1; then
    return 0
  fi
  \hash -r
}
```

```sh:line-numbers=1577 [原文]
nvm_hash_reset() {
  # under `set +h` there is no cache to clear, and `hash -r` errors
  if [ -n "${BASH_VERSION-}" ] && [ "${-#*h}" = "$-" ]; then
    return 0
  fi
  # `ksh93`'s `hash` takes no `-r` and its usage error is fatal; probing in a
  # subshell contains it, and spares the `ksh` variants that do accept `-r`
  if [ -n "${KSH_VERSION-}" ] && ! ( \hash -r ) >/dev/null 2>&1; then
    return 0
  fi
  \hash -r
}
```

:::

## 前提知識

- **コマンドのハッシュ**: シェルは、一度実行したコマンドの場所を覚えておき、次から PATH を探し直さずに済ませます。`hash -r` はこの記憶をすべて消します。
- **`$-`**: 今有効になっているシェルのオプションを 1 文字ずつ並べた特殊変数です。bash では、ハッシュ機能が有効だと `h` が含まれます（例: `himBH`）。
- **`set +h`**: bash でハッシュ機能を無効にするオプションです。
- **`${-#*h}`**: `$-` から「先頭から `h` まで」を取り除いた値です。`h` が含まれていなければ何も削れず、元の `$-` と同じになります。
- **`${BASH_VERSION-}` / `${KSH_VERSION-}`**: bash や ksh の中でだけ値が入る変数です。
- **`\hash`**: 前に `\` を付けると、`hash` という名前のエイリアスを無視します。
- **`( ... )`**: サブシェル。中で起きたことは外に影響しません。

## 何をしているか

### 1. bash でハッシュが無効なとき

bash で動いていて、しかも `$-` に `h` が無い（`set +h` されている）なら、消す記憶がそもそもありません。コメントのとおり、この状態で `hash -r` を実行するとエラーになるので、成功として終わります。

判定の `[ "${-#*h}" = "$-" ]` は、「`h` まで削っても値が変わらない＝`h` が無い」という意味です。

### 2. ksh93 のとき

ksh93 の `hash` は `-r` オプションを持たず、しかも使い方の誤りが「致命的なエラー」としてシェルごと止めてしまうことがあります（コメント）。そこで、**サブシェルの中で試しに `hash -r` を実行** し、失敗したら何もせずに終わります。サブシェルなら、致命的なエラーでもサブシェルが終わるだけで済みます。

### 3. 普通に実行

それ以外のシェルでは `\hash -r` を実行します。

## ここがすごい

- **「試してみる」をサブシェルに閉じ込める**: その機能があるか事前に知る方法が無いとき、安全な場所で実際に試すのが確実です。ksh の種類によっては `-r` が使えるので、一律に避けるのではなく試すことで、使えるシェルでは使っています。
- **`$-` を文字列操作で調べる**: オプションの有無を `case "$-" in *h*)` で調べることもできますが、パラメータ展開 1 つで同じ判定をしています。
- **小さなコマンド 1 つにも全シェル分の配慮**: nvm がどれほど多くのシェルで動作確認されているかがよくわかる関数です。

## まとめ

- PATH を変えた後は `hash -r` で、シェルが覚えているコマンドの場所を忘れさせる。
- `$-` を見ると、今有効なシェルのオプションがわかる。
- 失敗するとシェルごと止まるかもしれない操作は、サブシェルの中で試す。
