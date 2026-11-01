---
title: "debounce を部品にして throttle を組み立てる"
description: "呼び出しを一定間隔に間引く throttle を、別の関数 debounce の上に組み立てた実装。最後に呼んでから時間が経ったかだけを自分で見ている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/throttle.ts
lines: [51, 88]
function: "throttle"
difficulty: 2
tags: [非同期, 設計パターン, クロージャ]
---

## ひとことで

`throttle(func, ms)` は、何度呼ばれても `func` を **`ms` ミリ秒に最大 1 回** しか実行しない関数を作ります。
スクロールやマウス移動のように 1 秒に何十回も起きるイベントで、重い処理を間引くのに使います。

おもしろいのは、似た道具である `debounce`（呼び出しが止んでから一定時間後に 1 回だけ実行する関数）を **部品として再利用** し、足りない部分だけを自分で足している点です。

## コード

```ts:line-numbers=51
export function throttle<F extends (...args: any[]) => void>(
  func: F,
  throttleMs: number,
  { signal, edges = ['leading', 'trailing'] }: ThrottleOptions = {}
): ThrottledFunction<F> {
  let pendingAt: number | null = null;

  const debounced = debounce(
    function (this: any, ...args: Parameters<F>) {
      pendingAt = Date.now();
      func.apply(this, args);
    },
    throttleMs,
    { signal, edges }
  );

  const throttled = function (this: any, ...args: Parameters<F>) {
    if (pendingAt == null) {
      pendingAt = Date.now();
    }

    if (Date.now() - pendingAt >= throttleMs) {
      pendingAt = Date.now();
      func.apply(this, args);

      debounced.cancel();
      debounced.schedule();
      return;
    }

    debounced.apply(this, args);
  };

  throttled.cancel = debounced.cancel;
  throttled.flush = debounced.flush;

  return throttled;
}
```

## 前提知識

- **`F extends (...args: any[]) => void`**: 型引数 `F` は「何らかの関数の型」だという制約です。`Parameters<F>` はその関数の引数の型を取り出す組み込みの型です。
- **`{ signal, edges = [...] }: ThrottleOptions = {}`**: 第 3 引数をオブジェクトで受け取り、その場で分割代入しています。`edges` を省略したときの既定値は `['leading', 'trailing']`（最初と最後の両方で実行）です。
- **`function (this: any, ...)`**: TypeScript では、関数の中で使う `this` の型を最初の引数のように書けます（実際の引数にはなりません）。
- **`func.apply(this, args)`**: `func` を、`this` と引数の配列を指定して呼び出します。元の呼び出し方を崩さずに転送するための書き方です。
- **`Date.now()`**: 現在時刻をミリ秒の数値で返します。
- **関数にプロパティを付ける**: JavaScript では関数もオブジェクトなので、`throttled.cancel = …` のように後からメソッドを生やせます。

## 何をしているか

### 1. 実際の実行を debounce に包む（58〜65 行目）

`debounce` に渡す関数は、実行の直前に「最後に実行した時刻」`pendingAt` を記録してから `func` を呼びます。debounce 経由で遅れて実行された場合も、時刻が正しく更新されるわけです。

### 2. 呼ばれるたびに経過時間を見る（67〜82 行目）

- 初めて呼ばれたときは `pendingAt` に今の時刻を入れます（68〜70 行目）。
- 前回の実行から `throttleMs` 以上経っていたら、**その場ですぐ実行** します（72〜79 行目）。そのあと debounce の予約をいったん消して（`cancel`）、改めてタイマーだけを仕掛け直します（`schedule`）。
- まだ時間が経っていなければ、debounce に任せます（81 行目）。debounce は「最後の呼び出し」を覚えておいて、待ち時間のあとに実行してくれます。

100 ミリ秒の throttle で、10 ミリ秒ごとに呼ぶと次のように動きます。

```
0ms   呼び出し → debounce の leading で即実行
10〜90ms 呼び出し → debounce が最後の引数を保持
100ms 呼び出し → 経過 100ms なので即実行、タイマーを仕掛け直し
...
最後の呼び出しの 100ms 後 → debounce の trailing で最後の 1 回を実行
```

## ここがすごい

- **似た機能の上に組み立てる**: 「最後の呼び出しを覚えて、あとで実行する」「キャンセル」「今すぐ実行（flush）」といった面倒な部分はすべて debounce が持っています。throttle に固有なのは「一定時間が経ったら途中でも実行する」だけなので、そこだけを数行で書いています。
- **キャンセルの仕組みもそのまま使える**: 84〜85 行目で `cancel` と `flush` を debounce のものに差し替えるだけで、throttle にも同じ機能が付きます。`AbortSignal` によるキャンセル対応も debounce に渡すだけで済んでいます。
- **最後の 1 回を取りこぼさない**: 間引くだけの単純な実装だと、連続した呼び出しの最後の値（スクロールが止まった位置など）が捨てられがちです。debounce の trailing 実行があるので、最後の状態が必ず反映されます。

## まとめ

- throttle は「一定間隔で必ず実行」、debounce は「落ち着いてから 1 回実行」。
- 共通部分を持つ道具は、片方を部品にしてもう片方を作ると重複が減る。
- 関数にメソッドを生やすことで、`cancel` のような操作を同じ値から呼べるようにできる。
