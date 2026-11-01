---
title: "切り替える前のコンテキストを覚えて、戻れるようにする"
description: "コンテキストを切り替えるとき、直前の値を保存しておく関数。切り替え先が同じなら保存しない。後で「直前に戻る」ための準備になる。"
language: shell
project: "kubectx"
repo: https://github.com/ahmetb/kubectx
license: "Apache-2.0"
copyright: "Copyright 2017 Google LLC"
commit: "12ad6fb22e8c546ee2b54e7de38aa51c906832f7"
file: "kubectx"
lines: [131, 140]
function: "set_context"
difficulty: 2
format: 2
tags: [状態機械, API設計, イディオム]
---
## ひとことで

`set_context 名前` は、Kubernetes のコンテキストを切り替えるとともに、**切り替える前の値を保存しておく** 関数です。保存された値は、あとで `kubectx -` と打ったときに、元に戻るために使われます。

コンテキストを行ったり来たりすることは多いので、「直前の場所」を覚えておくと便利です。この関数は、その記録を残す役割を担っています。

## コード

```bash:line-numbers=131
set_context() {
  local prev
  prev="$(current_context)" || exit_err "error getting current context"

  switch_context "${1}"

  if [[ "${prev}" != "${1}" ]]; then
    save_context "${prev}"
  fi
}
```

## 前提知識

- **`current_context`**: 今使っているコンテキストの名前を表示する関数です。
- **`exit_err`**: エラーのメッセージを出して終了する関数です。
- **`switch_context`**: 実際に kubectl の設定を書き換えて、コンテキストを切り替える関数です。
- **`!=` の比較**: 2 つの文字列が違うかを調べます。
- **`prev`**: 切り替える前のコンテキストの名前を入れる変数です。

## 何をしているか

### 1. 今の値を覚える

```bash:line-numbers=133
  prev="$(current_context)" || exit_err "error getting current context"
```

切り替える前に、現在のコンテキストを `prev` に入れます。取得できなければ、エラーを出して終わります。

### 2. 切り替える

```bash:line-numbers=135
  switch_context "${1}"
```

引数で渡された名前に、コンテキストを切り替えます。

### 3. 違っていれば保存する

```bash:line-numbers=137
  if [[ "${prev}" != "${1}" ]]; then
    save_context "${prev}"
  fi
```

切り替え前と切り替え後の名前が違うときだけ、`save_context` で前の値を保存します。同じ名前に切り替えた場合は、保存を省きます。これで、直前の値が自分自身で上書きされるのを防ぎます。

## ここがすごい

- **同じ名前への切り替えを無視する**: 同じコンテキストに切り替えても、「直前」の情報を壊さないように、保存を省いています。
- **切り替えの前に値を取る**: 切り替えてから取ると、もう新しい値になっているので、記録できません。順番がとても大事です。
- **失敗を先に扱う**: 現在の値が取れなければ、切り替えの前に止まるので、中途半端な状態になりません。

## まとめ

- 状態を変える前に、元の値を取っておく。
- 同じ値への変更は、記録を上書きしないよう注意する。
- 順番を誤ると、記録が意味を失うので、処理の順番を大切にする。
