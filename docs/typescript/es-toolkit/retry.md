---
title: "失敗しても最後のエラーを覚えて粘り強く再試行する"
description: "非同期処理が失敗したら決めた回数だけやり直す retry。待ち時間を関数で計算できたり、中断や再試行の条件を指定できたりする。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/function/retry.ts
lines: [117, 160]
function: "retry"
difficulty: 2
tags: [非同期, エラー処理, API設計]
---

## ひとことで

`retry(func, options)` は、非同期の処理 `func` が失敗したら **決めた回数までやり直す** 関数です。ネットワーク通信のように、たまたま失敗することがある処理を安定させるのに使います。

```ts
await retry(() => fetchUser(id), { retries: 3, delay: (n) => 100 * 2 ** n })
```

回数だけを数値で渡す簡単な使い方と、待ち時間や条件を細かく指定する使い方の両方を、1 つの関数で受け付けています。

## コード

```ts:line-numbers=117
export async function retry<T>(func: () => Promise<T>, _options?: number | RetryOptions): Promise<T> {
  let delay: number | ((attempts: number, error: unknown) => number);
  let retries: number;
  let signal: AbortSignal | undefined;
  let shouldRetry: (error: unknown, attempt: number) => boolean;

  if (typeof _options === 'number') {
    delay = DEFAULT_DELAY;
    retries = _options;
    signal = undefined;
    shouldRetry = DEFAULT_SHOULD_RETRY;
  } else {
    delay = _options?.delay ?? DEFAULT_DELAY;
    retries = _options?.retries ?? DEFAULT_RETRIES;
    signal = _options?.signal;
    shouldRetry = _options?.shouldRetry ?? DEFAULT_SHOULD_RETRY;
  }

  let error;

  for (let attempts = 0; attempts <= retries; attempts++) {
    if (signal?.aborted) {
      throw error ?? new Error(`The retry operation was aborted due to an abort signal.`);
    }

    try {
      return await func();
    } catch (err) {
      error = err;

      // Determine if we should retry based on the provided shouldRetry function
      if (!shouldRetry(err, attempts)) {
        throw err;
      }

      if (attempts < retries) {
        const currentDelay = typeof delay === 'function' ? delay(attempts, error) : delay;
        await delayToolkit(currentDelay);
      }
    }
  }

  throw error;
}
```

`delayToolkit` は同じライブラリの `delay` 関数を別名で読み込んだもので、指定したミリ秒だけ待つ Promise を返します。

## 前提知識

- **`async` / `await`**: `async` を付けた関数は Promise（あとで結果が届く値）を返します。中で `await` を使うと、その Promise の結果が出るまで待ってから次へ進めます。
- **`try { … } catch (err) { … }`**: `try` の中でエラーが起きると `catch` に飛びます。`await` した Promise が失敗した場合もここで捕まえられます。
- **`??`（Null 合体演算子）**: 左が `null` か `undefined` のときだけ右の値を使います。`0` や `false` はそのまま使われるので、`||` より既定値の指定に向いています。
- **`?.`（オプショナルチェーン）**: 左が `null` か `undefined` ならエラーにせず `undefined` を返します。`_options?.delay` は「オプションが渡されていれば `delay` を読む」という意味です。
- **`AbortSignal`**: 処理を外から中断するための仕組みです。`signal.aborted` が `true` になったら中断の合図です。
- **`Number.POSITIVE_INFINITY`**: 正の無限大です。回数の既定値に使うと「成功するまで何度でも」になります。

## 何をしているか

### 1. 引数の形を揃える（123〜133 行目）

第 2 引数が数値ならそれを回数とし、ほかは既定値にします。オブジェクトなら各項目を取り出し、なければ既定値（待ち時間 0、回数無限、常に再試行）にします。以降のコードは、どちらの呼び方だったかを気にしなくて済みます。

### 2. ループで試す（137〜157 行目）

`attempts` は 0 から始まるので、ループは最大 `retries + 1` 回、つまり「最初の 1 回 + 再試行 `retries` 回」です。

- 中断の合図が来ていたら、それまでの最後のエラー（なければ中断のエラー）を投げます（138〜140 行目）。
- `await func()` が成功したら、その値を返して終わりです（143 行目）。
- 失敗したらエラーを覚え（145 行目）、`shouldRetry` が「やり直さない」と言えば即座に投げます（148〜150 行目）。
- まだ回数が残っていれば待ってから次へ（152〜155 行目）。待ち時間は、関数なら回数とエラーから計算します。

### 3. 全部失敗したら最後のエラーを投げる（159 行目）

## ここがすごい

- **呼び方を最初に正規化する**: 数値かオブジェクトかの分岐を冒頭にまとめ、本体のループは 1 種類だけにしています。オプションが増えても本体は読みやすいままです。
- **待ち時間を関数にできる**: 回数に応じて待ち時間を倍々に増やす「指数バックオフ」や、エラーの種類で待ち方を変えることが、使う側の 1 行で書けます。
- **最後の 1 回のあとは待たない**: 152 行目の `attempts < retries` のおかげで、もう再試行しないのに無駄に待つことがありません。
- **元のエラーを投げ直す**: 最終的に投げるのは、ライブラリが作った「失敗しました」ではなく、`func` が実際に投げたエラーです。呼び出し元は本当の原因（HTTP のステータスなど）をそのまま調べられます。
- **やり直しても無駄なエラーを見分けられる**: `shouldRetry` で「404 はやり直しても無駄なので即終了」のような判断ができます。

## まとめ

- 再試行は「最初の 1 回 + n 回」のループと `try/catch` で書ける。
- 複数の呼び方を受け付ける関数は、冒頭で引数を 1 つの形に揃えると本体が単純になる。
- 失敗し続けたら、元のエラーをそのまま投げると原因を追いやすい。
