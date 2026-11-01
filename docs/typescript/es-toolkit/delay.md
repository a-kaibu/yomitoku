---
title: "途中で取り消せる「待つだけ」の Promise"
description: "指定ミリ秒だけ待つ delay。AbortSignal で途中キャンセルでき、キャンセル時はタイマーを消してエラーで知らせる。後片付けの対称性がきれい。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/promise/delay.ts
lines: [39, 61]
function: "delay"
difficulty: 2
tags: [非同期, エラー処理, イディオム]
---

## ひとことで

`delay(ms)` は、**`ms` ミリ秒たったら完了する Promise** を返します。`await delay(1000)` と書けば「1 秒待つ」になります。

さらに `AbortSignal` を渡すと、待っている途中で **取り消す** ことができ、そのときは `AbortError` で失敗します。短い関数ですが、タイマーとイベント登録の後片付けが丁寧に書かれています。

## コード

```ts:line-numbers=39
export function delay(ms: number, { signal }: DelayOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => {
      reject(new AbortError());
    };

    const abortHandler = () => {
      clearTimeout(timeoutId);
      abortError();
    };

    if (signal?.aborted) {
      return abortError();
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      resolve();
    }, ms);

    signal?.addEventListener('abort', abortHandler, { once: true });
  });
}
```

`AbortError` は同じライブラリで定義されたエラーのクラスです。

## 前提知識

- **`new Promise((resolve, reject) => { … })`**: Promise を作る書き方です。`resolve()` を呼ぶと成功、`reject(err)` を呼ぶと失敗になります。
- **`setTimeout(fn, ms)`**: `ms` ミリ秒後に `fn` を実行する予約をし、予約の ID を返します。`clearTimeout(id)` で予約を取り消せます。
- **`AbortSignal`**: 処理を外から中断するための合図です。`aborted` が `true` なら中断済み、`'abort'` イベントで中断を知ることができます。
- **`{ signal }: DelayOptions = {}`**: 第 2 引数をオブジェクトで受け取り、そこから `signal` を取り出します。省略されたら空のオブジェクトが使われます。
- **`const` の巻き上げとクロージャ**: 45〜48 行目の関数は、54 行目で作る `timeoutId` を使っています。関数が実際に呼ばれるのは `timeoutId` が作られたあとなので問題ありません。

## 何をしているか

### 1. 取り消し用の関数を用意（41〜48 行目）

`abortError` は失敗させるだけ、`abortHandler` はタイマーを消してから失敗させます。

### 2. すでに取り消されていたら即失敗（50〜52 行目）

タイマーを仕掛ける前に確認し、無駄な予約をしないようにしています。

### 3. タイマーを仕掛ける（54〜57 行目）

時間が来たら、取り消しの監視を外してから成功させます。

### 4. 取り消しを監視する（59 行目）

`once: true` なので、合図を受け取ったら登録は自動で外れます。

## ここがすごい

- **後片付けが対称になっている**: 時間どおり終わった場合はイベントの監視を外し（55 行目）、取り消された場合はタイマーを消します（46 行目）。どちらの道を通っても、もう一方が残りません。イベントの監視が残ると、長く使い回される `signal` にリスナーが溜まっていき、メモリが解放されなくなります。
- **事前チェックで無駄を省く**: すでに中断済みの `signal` を渡された場合はタイマーも登録もせず、すぐに失敗させます。中断済みの `signal` には `'abort'` イベントがもう来ないので、このチェックがないと永遠に待ってしまいます。
- **Web 標準の作法に沿う**: 中断を `AbortSignal` で受け取り、`AbortError` で知らせるのは `fetch` などの Web 標準 API と同じ作法です。`fetch` と同じ `signal` を渡せば、通信と待ち時間をまとめて取り消せます。

## まとめ

- 「待つ」は `setTimeout` を Promise で包むだけで作れる。
- 取り消し可能にするなら、すでに取り消し済みの場合と、両方向の後片付けを忘れない。
- 中断は `AbortSignal` で受け取ると、Web 標準の API と組み合わせやすい。
