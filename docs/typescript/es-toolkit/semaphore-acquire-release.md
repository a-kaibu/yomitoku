---
title: "Promise の resolve を行列に並べて作るセマフォ"
description: "同時に動く非同期処理の数を制限するセマフォ。待っている人の「resolve 関数」をキューに積み、空きが出たらそれを呼ぶだけで順番待ちを実現している。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/promise/semaphore.ts
lines: [72, 109]
function: "Semaphore#acquire / Semaphore#release"
difficulty: 3
tags: [非同期, 並行処理, データ構造]
---

## ひとことで

`Semaphore`（セマフォ）は、**同時に実行できる処理の数を制限する** ための道具です。
たとえば `new Semaphore(3)` を使えば、100 件のダウンロードを始めても、実際に同時に走るのは 3 件までにできます。

JavaScript には「スレッドを止めて待つ」命令がありません。そこでこの実装は、**まだ解決していない Promise の `resolve` 関数を行列に並べておき、空きが出たら呼び出す** というやり方で「待たせる」を作っています。

## コード

```ts:line-numbers=72
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    return new Promise<void>(resolve => {
      this.deferredTasks.enqueue(resolve);
    });
  }

  /**
   * Releases a semaphore, allowing one more operation to proceed.
   *
   * @example
   * const sema = new Semaphore(1);
   *
   * async function task() {
   *   await sema.acquire();
   *   try {
   *     // This code can only be executed by two tasks at the same time
   *   } finally {
   *     sema.release(); // Allows another waiting task to proceed.
   *   }
   * }
   */
  release(): void {
    const deferredTask = this.deferredTasks.dequeue();

    if (deferredTask != null) {
      deferredTask();
      return;
    }

    if (this.available < this.capacity) {
      this.available++;
    }
  }
```

`this.available` は残りの空き枠の数、`this.capacity` は最大数、`this.deferredTasks` は待っている人の行列（先に入れたものから取り出すキュー）です。

## 前提知識

- **Promise**: 「あとで結果が届く値」です。`new Promise(resolve => { … })` で作り、中で `resolve()` を呼んだ瞬間に「完了」になります。`await` はその完了を待ちます。
- **`resolve` は持ち出せる**: `resolve` はただの関数なので、変数や配列に保存して **あとで別の場所から呼ぶ** こともできます。この実装の要です。
- **`async acquire(): Promise<void>`**: `async` 関数は必ず Promise を返します。`void` は「結果の値はない」という意味です。
- **キュー（待ち行列）**: 先に入れたものから順に取り出すデータ構造です。`enqueue` で末尾に入れ、`dequeue` で先頭から取り出します。
- **`private`**: クラスの外から触れないメンバーであることを示します。

## 何をしているか

### acquire: 枠を取る（72〜81 行目）

- 空きがあれば（73 行目）、空きを 1 つ減らしてすぐ終わります。`async` 関数なので、すぐ完了する Promise が返ります。
- 空きがなければ、新しい Promise を作り、その `resolve` を行列に並べて返します（78〜80 行目）。誰かが `resolve` を呼ぶまで、`await sema.acquire()` した側はずっと待つことになります。

### release: 枠を返す（98〜109 行目）

- 行列に待っている人がいれば、先頭の `resolve` を呼んで **枠をその人に直接手渡し** します（99〜104 行目）。このとき `available` は増やしません。
- 誰も待っていなければ、空き枠を 1 つ増やします（106〜108 行目）。最大値を超えないようにも確認しています。

容量 1 で A、B が順に `acquire` した場合はこう動きます。

```
A.acquire → 空き 1 → 0。A は実行
B.acquire → 空き 0。B の resolve を行列へ（B は待つ）
A.release → 行列に B → B の resolve を呼ぶ（空きは 0 のまま）。B が実行
B.release → 行列は空 → 空き 0 → 1
```

## ここがすごい

- **「待つ」を Promise だけで表現**: ロックの待機を、OS の機能も特別なライブラリも使わず、`resolve` を保存して後で呼ぶだけで実現しています。JavaScript の非同期の仕組みをよく理解したうえでの書き方です。
- **枠を直接手渡しする**: `release` で `available` を増やしてから待ち人に取らせる方式だと、その間に新しく来た人に枠を横取りされる可能性があります。手渡し方式なら、先に待っていた人が必ず先に進めます（公平）。
- **行列の実装まで気を配る**: 41 行目のコメントにあるとおり、配列の `shift`（先頭の削除）は要素が多いと遅く、長い行列を処理すると全体が 2 乗のオーダーで遅くなることがありました。専用の `Queue` を使うことで、取り出しを一定時間にしています。
- **`Mutex` はこれの容量 1 版**: 同じライブラリの `Mutex` は `new Semaphore(1)` を包むだけで作られています。

## まとめ

- `resolve` を保存してあとで呼べば、「条件が整うまで待つ」を作れる。
- 枠を返すときは、待っている人に直接渡すと横取りが起きない。
- 先頭から取り出す行列には、配列の `shift` より専用のキューが向いている。
