---
title: "解除されたら「永遠に決着しない」タイムアウト"
description: "指定時間後に失敗する Promise を作る timeout。中断の合図を受けたら成功も失敗もさせず、わざと未決のまま放置するのがポイント。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/promise/timeout.ts
lines: [39, 58]
function: "timeout"
difficulty: 3
format: 2
tags: [非同期, エラー処理, 防御的プログラミング]
---

## ひとことで

`timeout(ms)` は、**`ms` ミリ秒たつと `TimeoutError` で失敗する Promise** を返す関数です。
単体ではあまり使わず、`Promise.race([本来の処理, timeout(1000)])` のように「どちらが先に終わるか」の競争相手として使います。

面白いのは、外から「もうタイムアウトは不要」と合図されたときの振る舞いです。成功させるのでも失敗させるのでもなく、**わざと永遠に決着しないまま放置** します。

## コード

::: code-group

```ts:line-numbers=39 [日本語訳]
export function timeout(ms: number, { signal }: TimeoutOptions = {}): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    const abortHandler = () => {
      // // 解除されたタイマーは決して決着してはならない。さもないと、降りるはずだった競争に勝ってしまう。
      // // そのため、タイマーを消したうえで、わざと未決のまま残す。
      clearTimeout(timeoutId);
    };

    if (signal?.aborted) {
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      reject(new TimeoutError());
    }, ms);

    signal?.addEventListener('abort', abortHandler, { once: true });
  });
}
```

```ts:line-numbers=39 [原文]
export function timeout(ms: number, { signal }: TimeoutOptions = {}): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    const abortHandler = () => {
      // A disarmed timeout must never settle, otherwise it could win the race it was
      // meant to drop out of. Clear the timer and intentionally leave it pending.
      clearTimeout(timeoutId);
    };

    if (signal?.aborted) {
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      reject(new TimeoutError());
    }, ms);

    signal?.addEventListener('abort', abortHandler, { once: true });
  });
}
```

:::

`TimeoutError` は同じライブラリで定義されたエラーのクラスです。

## 前提知識

- **`Promise<never>`**: `never` は「値が決して存在しない」型です。この Promise は成功（resolve）することがなく、失敗するか、決着しないかのどちらかであることを型で表しています。
- **`(_resolve, reject) => …`**: Promise を作るときの関数です。`_resolve` の先頭の `_` は「使わない引数」という慣習です。
- **`setTimeout` / `clearTimeout`**: 一定時間後に関数を実行する予約と、その予約の取り消しです。
- **`AbortSignal`**: 処理を外から中断するための合図です。`aborted` で中断済みか調べられ、`'abort'` イベントで中断を知ることができます。
- **`{ once: true }`**: イベントを 1 回受け取ったら自動で登録を解除するオプションです。
- **`Promise.race`**: 複数の Promise のうち、**最初に決着した（成功か失敗した）もの** の結果を採用します。

## 何をしているか

### 1. 中断されたときの処理

```ts:line-numbers=41
    const abortHandler = () => {
      // A disarmed timeout must never settle, otherwise it could win the race it was
      // meant to drop out of. Clear the timer and intentionally leave it pending.
      clearTimeout(timeoutId);
    };
```
中断の合図が来たらタイマーを取り消すだけです。`reject` も `resolve` も呼びません。

### 2. すでに中断済みなら何もしない

```ts:line-numbers=47
    if (signal?.aborted) {
      return;
    }
```
タイマーも仕掛けずに戻ります。この Promise は永遠に決着しません。

### 3. タイマーを仕掛ける

```ts:line-numbers=51
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      reject(new TimeoutError());
    }, ms);

    signal?.addEventListener('abort', abortHandler, { once: true });
```
時間が来たら、中断の監視を外してから `TimeoutError` で失敗させます。あわせて、中断の合図を 1 回だけ受け取るように登録します。

```ts:line-numbers=52
      signal?.removeEventListener('abort', abortHandler);
      reject(new TimeoutError());
```

```ts:line-numbers=56
    signal?.addEventListener('abort', abortHandler, { once: true });
```


## ここがすごい

- **決着させないことで競争から降りる**: `Promise.race` は最初に決着したものを採用します。もし中断時に `reject` してしまうと、その中断エラーが競争に勝ってしまい、本来の処理の結果が捨てられるおそれがあります。`abortHandler` の中のコメントのとおり、「解除されたタイマーは決して決着してはならない。さもないと、降りるはずだった競争に勝ってしまう」のです。
- **後片付けを両方向で**: 時間切れのときは `removeEventListener` で中断の監視を外し、中断のときは `clearTimeout` でタイマーを消します。どちらで終わっても、もう片方が残り続けることはありません。タイマーが残るとプログラムが終了しにくくなり、イベント登録が残るとメモリが解放されません。
- **型で性質を表す**: 戻り値を `Promise<never>` にしているので、`Promise.race([fetchUser(), timeout(1000)])` の結果の型は `fetchUser` の型だけになります。タイムアウト側が値を返すことはないと TypeScript が理解してくれるからです。

## まとめ

- `Promise.race` の競争相手は、不要になったら「決着しない」ことで静かに降りられる。
- タイマーとイベント登録は、どちらで終わっても両方を片付ける。
- `never` 型を使うと、「この Promise は成功しない」ことを型で伝えられる。
