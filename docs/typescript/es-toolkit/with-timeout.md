---
title: "AbortController で後始末を一括で済ませる時間制限"
description: "非同期処理に時間制限をかける withTimeout。内部の AbortController を finally で必ず abort し、タイマーとイベント登録をまとめて片付けている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/promise/withTimeout.ts
lines: [45, 62]
function: "withTimeout"
difficulty: 3
format: 2
tags: [非同期, エラー処理, 設計パターン]
---

## ひとことで

`withTimeout(run, ms)` は、非同期処理 `run` に **`ms` ミリ秒の時間制限** をかけます。時間内に終われば結果を返し、間に合わなければ `TimeoutError` で失敗します。

```ts
const user = await withTimeout(() => fetchUser(id), 3000)
```

中心は `Promise.race` ですが、終わったあとにタイマーやイベント登録を **確実に片付ける** ために、内部用の `AbortController` を 1 つ作って使っているのが見どころです。

## コード

```ts:line-numbers=45
export async function withTimeout<T>(
  run: () => Promise<T>,
  ms: number,
  { signal }: WithTimeoutOptions = {}
): Promise<T> {
  const controller = new AbortController();

  if (signal?.aborted) {
    controller.abort();
  }
  signal?.addEventListener('abort', () => controller.abort(), { once: true, signal: controller.signal });

  try {
    return await Promise.race([run(), timeout(ms, { signal: controller.signal })]);
  } finally {
    controller.abort();
  }
}
```

`timeout(ms, { signal })` は同じライブラリの関数で、`ms` ミリ秒後に失敗する Promise を返します。`signal` が中断されると、タイマーを消して決着しないまま放置されます。

## 前提知識

- **`AbortController` と `AbortSignal`**: 中断を伝える仕組みです。`controller.abort()` を呼ぶと、`controller.signal` を受け取った全員に「中断」が伝わります。
- **`Promise.race([a, b])`**: 先に決着したほうの結果（成功でも失敗でも）を採用します。
- **`try { return … } finally { … }`**: `finally` の中は、`try` が成功で終わっても失敗で終わっても **必ず実行** されます。`return` のあとでも実行されます。
- **`addEventListener(…, { once, signal })`**: `once: true` は 1 回受け取ったら登録解除、`signal` を渡すと **その signal が中断されたときに登録が自動で外れます**。
- **`?.`**: 左が `null` / `undefined` なら何もしない呼び出しです。`signal` は省略可能なので使っています。

## 何をしているか

### 1. 内部用のコントローラを作る

```ts:line-numbers=50
  const controller = new AbortController();
```
この関数の中だけで使う `controller` を作ります。

### 2. 呼び出し元の中断を中継する

```ts:line-numbers=52
  if (signal?.aborted) {
    controller.abort();
  }
  signal?.addEventListener('abort', () => controller.abort(), { once: true, signal: controller.signal });
```
呼び出し元から `signal` が渡されていて、すでに中断済みなら内部もすぐ中断します。まだなら、呼び出し元の中断を内部に中継するリスナーを登録します。このリスナー自体にも `signal: controller.signal` を指定しているので、内部が中断されると **リスナーの登録も自動で外れます**。

### 3. 競争させて、必ず片付ける

```ts:line-numbers=57
  try {
    return await Promise.race([run(), timeout(ms, { signal: controller.signal })]);
  } finally {
    controller.abort();
  }
```
`run()` と `timeout(…)` を競争させます。`run` が先に終わればその結果が、時間切れならタイムアウトのエラーが返ります。どちらの場合も、`finally` で `controller.abort()` を呼びます。

この 1 回の `abort` で、次の 2 つが同時に片付きます。

- `timeout` のタイマーが消える（もう時間切れのエラーは起きない）。
- 呼び出し元 `signal` に付けた中継リスナーが外れる。

## ここがすごい

- **後片付けを「1 つのスイッチ」にまとめた**: タイマーの ID やリスナー関数を自分で覚えて個別に解除する代わりに、関係するものすべてに同じ `controller.signal` を渡しておき、最後に 1 回 `abort` するだけで全部を解除しています。片付け忘れが起きにくい設計です。
- **`finally` で確実に**: 成功・失敗・時間切れのどれで抜けても `finally` は必ず通ります。タイマーが残ってプログラムの終了を妨げることも、長く生きる `signal` にリスナーが溜まり続けることもありません。
- **外の中断にも内側から応える**: 呼び出し元が中断すると内部も中断され、タイマーが止まります。上位の処理が「もう要らない」と判断したら、時間制限の仕組みもすぐに止まるわけです。

## まとめ

- 片付けが必要なもの全部に同じ `AbortSignal` を渡せば、`abort()` 1 回でまとめて解除できる。
- `try … finally` は「成功でも失敗でも必ずやる後始末」の定位置。
- `addEventListener` の `signal` オプションで、リスナーの登録解除を自動化できる。
