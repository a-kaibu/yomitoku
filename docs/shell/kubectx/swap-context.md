---
title: "保存しておいた直前のコンテキストへ、ワンステップで戻る"
description: "保存された直前のコンテキストを読み出して切り替える関数。保存が無ければエラーにする。ハイフンで前の場所へ戻るような操作を実現する。"
language: shell
project: "kubectx"
repo: https://github.com/ahmetb/kubectx
license: "Apache-2.0"
copyright: "Copyright 2017 Google LLC"
commit: "12ad6fb22e8c546ee2b54e7de38aa51c906832f7"
file: "kubectx"
lines: [142, 150]
function: "swap_context"
difficulty: 1
format: 2
tags: [API設計, 状態機械, CLI]
---
## ひとことで

`swap_context` は、**1 つ前に使っていたコンテキストへ戻る** 関数です。`kubectx -` のような操作で呼ばれ、保存しておいた直前の名前を読み出して、そこへ切り替えます。

`cd -` で直前のディレクトリへ戻るのと同じ発想です。2 つの接続先を行き来する作業が多いときに、名前を覚える手間を減らします。

## コード

```bash:line-numbers=142
swap_context() {
  local ctx
  ctx="$(read_context)"
  if [[ -z "${ctx}" ]]; then
    echo "error: No previous context found." >&2
    exit 1
  fi
  set_context "${ctx}"
}
```

## 前提知識

- **`read_context`**: 保存されている直前のコンテキストの名前を読み出す関数です。
- **`-z`**: 文字列が空かどうかを調べる条件です。
- **`>&2`**: エラーを標準エラーに出す指定です。
- **`set_context`**: コンテキストを切り替えて、その前の値を保存する関数です。前の記事で扱いました。

## 何をしているか

### 1. 保存された値を読む

```bash:line-numbers=144
  ctx="$(read_context)"
```

`read_context` で、直前に使っていたコンテキストの名前を読み出し、`ctx` に入れます。

### 2. 保存がなければエラーにする

```bash:line-numbers=145
  if [[ -z "${ctx}" ]]; then
    echo "error: No previous context found." >&2
    exit 1
  fi
```

値が空なら、まだ切り替えた記録が無いということです。エラーメッセージを出して終了します。

### 3. 切り替える

```bash:line-numbers=149
  set_context "${ctx}"
```

読み出した名前を `set_context` に渡します。ここで切り替えが行われ、今の値が新しい「直前」として保存されます。

これによって、もう一度 `swap_context` を呼ぶと、元の場所へ戻ります。

## ここがすごい

- **2 つの値を入れ替える**: 「今」と「直前」を入れ替える仕組みが、保存と切り替えの組み合わせだけで成り立っています。
- **既存の関数を再利用**: 切り替えの処理を `set_context` に任せているので、記録の仕組みを 1 か所で管理できます。
- **記録が無いときの扱い**: 空の値をそのまま使わず、先にエラーにしています。

## まとめ

- 直前の状態を覚えておくと、元に戻る操作が簡単になる。
- 状態を入れ替える処理は、保存と切り替えを組み合わせて作れる。
- 記録が無い場合のエラーは、早めに出すと分かりやすい。
