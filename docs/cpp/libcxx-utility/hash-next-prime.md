---
title: 2・3・5・7 の倍数を最初から候補に入れない、次の素数探し
description: unordered_map のバケット数を決める __next_prime。210 で割った余りの表で 2, 3, 5, 7 の倍数を飛ばし、試し割りする数も同じ規則で絞る。goto を使った多重ループ脱出も見どころ。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/src/hash.cpp
lines: [72, 129]
function: std::__next_prime
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算, ハッシュ]
---
## ひとことで

`__next_prime(n)` は、**n 以上で最小の素数** を返す関数です。
たとえば `__next_prime(100)` は 101、`__next_prime(212)` は 223 です。
`std::unordered_map` などのハッシュ表は、バケット（データを入れる箱）の数を素数にすることがあり、そのときにこの関数が使われます。

## コード

::: code-group

```cpp:line-numbers=72 [日本語訳]
size_t __next_prime(size_t n) {
  const size_t L = 210;
  const size_t N = sizeof(small_primes) / sizeof(small_primes[0]);
  // n が十分小さければ small_primes から探す
  if (n <= small_primes[N - 1])
    return *std::lower_bound(small_primes, small_primes + N, n);
  // そうでなければ n は small_primes の最大値より大きい
  // 桁あふれを確認する
  __check_for_overflow(n);
  // 候補（L * k0 + indices[in]）の列を探し始める
  const size_t M = sizeof(indices) / sizeof(indices[0]);
  // n 以上で最初の候補を選ぶ
  //   n >= L であることは事前にわかっている
  size_t k0 = n / L;
  size_t in = static_cast<size_t>(std::lower_bound(indices, indices + M, n - k0 * L) - indices);
  n         = L * k0 + indices[in];
  while (true) {
    // n を素数または候補 (i) で、次のどちらかになるまで割っていく:
    //    1.  割り切れた。なら次の候補を試す。
    //    2.  i > sqrt(n) になった。なら n は素数。
    // n が 2, 3, 5, 7 で割り切れないことは事前にわかっているので、
    //    それらでは試さない（j == 5 -> まず 11 で割る）。また
    //    候補は 211 から始まるので、small_primes の最後の素数でも
    //    試さない。
    for (size_t j = 5; j < N - 1; ++j) {
      const std::size_t p = small_primes[j];
      const std::size_t q = n / p;
      if (q < p)
        return n;
      if (n == q * p)
        goto next;
    }
    // n は小さな素数で割り切れなかった。候補で試す
    {
      size_t i = 211;
      while (true) {
        for (auto inc : increments) {
          i += inc;
          std::size_t q = n / i;
          if (q < i)
            return n;
          if (n == q * i)
            goto next;
        }

        // これで i が候補の次の「周回」へ進む
        i += 2;
      }
    }
  next:
    // n は素数ではない。n を次の候補へ進める。
    if (++in == M) {
      ++k0;
      in = 0;
    }
    n = L * k0 + indices[in];
  }
}
```

```cpp:line-numbers=72 [原文]
size_t __next_prime(size_t n) {
  const size_t L = 210;
  const size_t N = sizeof(small_primes) / sizeof(small_primes[0]);
  // If n is small enough, search in small_primes
  if (n <= small_primes[N - 1])
    return *std::lower_bound(small_primes, small_primes + N, n);
  // Else n > largest small_primes
  // Check for overflow
  __check_for_overflow(n);
  // Start searching list of potential primes: L * k0 + indices[in]
  const size_t M = sizeof(indices) / sizeof(indices[0]);
  // Select first potential prime >= n
  //   Known a-priori n >= L
  size_t k0 = n / L;
  size_t in = static_cast<size_t>(std::lower_bound(indices, indices + M, n - k0 * L) - indices);
  n         = L * k0 + indices[in];
  while (true) {
    // Divide n by all primes or potential primes (i) until:
    //    1.  The division is even, so try next potential prime.
    //    2.  The i > sqrt(n), in which case n is prime.
    // It is known a-priori that n is not divisible by 2, 3, 5 or 7,
    //    so don't test those (j == 5 ->  divide by 11 first).  And the
    //    potential primes start with 211, so don't test against the last
    //    small prime.
    for (size_t j = 5; j < N - 1; ++j) {
      const std::size_t p = small_primes[j];
      const std::size_t q = n / p;
      if (q < p)
        return n;
      if (n == q * p)
        goto next;
    }
    // n wasn't divisible by small primes, try potential primes
    {
      size_t i = 211;
      while (true) {
        for (auto inc : increments) {
          i += inc;
          std::size_t q = n / i;
          if (q < i)
            return n;
          if (n == q * i)
            goto next;
        }

        // This will loop i to the next "plane" of potential primes
        i += 2;
      }
    }
  next:
    // n is not prime.  Increment n to next potential prime.
    if (++in == M) {
      ++k0;
      in = 0;
    }
    n = L * k0 + indices[in];
  }
}
```

:::

ここで使われている 3 つの表は、同じファイルの関数より前で定義されています（関数外のコードですが、読むのに必要なので引用します）。`small_primes` は 0 と 211 までの素数、`indices` は 210 未満で 2, 3, 5, 7 のどれでも割り切れない 48 個の数、`increments` は `indices` の隣どうしの差です。

```cpp:line-numbers=20
// handle all next_prime(i) for i in [1, 210), special case 0
const unsigned small_primes[] = {
    0,   2,   3,   5,   7,   11,  13,  17,  19,  23,  29,  31,  37,  41,  43,  47,
    53,  59,  61,  67,  71,  73,  79,  83,  89,  97,  101, 103, 107, 109, 113, 127,
    131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211};

// potential primes = 210*k + indices[i], k >= 1
//   these numbers are not divisible by 2, 3, 5 or 7
//   (or any integer 2 <= j <= 10 for that matter).
const unsigned indices[] = {
    1,   11,  13,  17,  19,  23,  29,  31,  37,  41,  43,  47,  53,  59,  61,  67,
    71,  73,  79,  83,  89,  97,  101, 103, 107, 109, 113, 121, 127, 131, 137, 139,
    143, 149, 151, 157, 163, 167, 169, 173, 179, 181, 187, 191, 193, 197, 199, 209};

// These are the amount we increment by when checking for potential
// primes in the  loop in __next_prime.
const uint8_t increments[] = {
    0, 10, 2, 4, 2, 4, 6, 2, 6, 4, 2, 4, 6, 6, 2, 6, 4, 2, 6, 4, 6, 8, 4, 2,
    4, 2,  4, 8, 6, 4, 6, 2, 4, 6, 2, 6, 6, 4, 2, 4, 6, 2, 6, 4, 2, 4, 2, 10,
};
```

## 前提知識

- **`size_t`**: 配列の大きさなどに使う符号なし整数型です。64 ビット環境では 64 ビットです。
- **`sizeof(配列) / sizeof(配列[0])`**: 配列の要素数を求める C 言語以来の定番の書き方です。
- **`std::lower_bound(先頭, 末尾, 値)`**: 並んだ配列から「値以上の最初の要素」の位置を二分探索で探します。`*` を付けるとその要素の値、`- 先頭` を引くと添字になります。
- **`static_cast<size_t>(...)`**: 型変換です。
- **`for (auto inc : increments)`**: 配列の要素を先頭から順に `inc` に入れて回す範囲 for 文です。
- **`goto next;`**: ラベル `next:`へ直接ジャンプします。C++ にはループを一度に何重も抜ける構文がないので、ここでは `goto` を使っています。
- **ブロック `{ ... }`**: 変数 `i` の有効範囲を区切っています。`goto` でこのブロックの外へ飛ぶのは問題ありません。

## 何をしているか

### 1. 小さい n は表を引く

```cpp:line-numbers=76
  if (n <= small_primes[N - 1])
    return *std::lower_bound(small_primes, small_primes + N, n);
```

n が 211 以下なら、素数表 `small_primes` を二分探索するだけです。`n = 100` なら表の中の 101 が返ります。

### 2. 桁あふれの確認

```cpp:line-numbers=80
  __check_for_overflow(n);
```

`size_t` の最大値付近では次の素数が表せないので、例外を投げます（同じファイルの `__check_for_overflow`）。

### 3. 最初の候補を作る

```cpp:line-numbers=85
  size_t k0 = n / L;
  size_t in = static_cast<size_t>(std::lower_bound(indices, indices + M, n - k0 * L) - indices);
  n         = L * k0 + indices[in];
```

210 = 2 × 3 × 5 × 7 です。どの数も `210 × k + r`（r は 0〜209）と書けます。2, 3, 5, 7 で割り切れない数は、余り r が `indices` の 48 個のどれかのときだけです。

`n = 212` なら `k0 = 1`、余りは 2 です。`indices` で 2 以上の最初は 11 なので、最初の候補は `210 + 11 = 221` です。

### 4. 試し割り

```cpp:line-numbers=96
    for (size_t j = 5; j < N - 1; ++j) {
      const std::size_t p = small_primes[j];
      const std::size_t q = n / p;
      if (q < p)
        return n;
      if (n == q * p)
        goto next;
    }
```

```cpp:line-numbers=105
    {
      size_t i = 211;
      while (true) {
        for (auto inc : increments) {
          i += inc;
          std::size_t q = n / i;
          if (q < i)
            return n;
          if (n == q * i)
            goto next;
        }

        // これで i が候補の次の「周回」へ進む
        i += 2;
      }
    }
```

候補を、11 から順に「割る数」で割っていきます。

- 商 `q` が割る数 `p` より小さくなったら、`p` は √n を超えたということなので、n は素数です。
- 割り切れたら素数ではないので、`goto next` で次の候補へ。

221 は 13 で割り切れる（13 × 17）ので、次の候補へ進みます。

表の素数（199 まで）で割り切れなければ、211 から先の割る数も「2, 3, 5, 7 の倍数でない数」だけを `increments` の差で作りながら続けます。

### 5. 次の候補へ

```cpp:line-numbers=121
  next:
    // n は素数ではない。n を次の候補へ進める。
    if (++in == M) {
      ++k0;
      in = 0;
    }
    n = L * k0 + indices[in];
```

`indices` の次の値に進み、表の終わりなら `k0` を 1 つ増やします。221 の次は `210 + 13 = 223` です。223 は 11, 13 で割り切れず、17 で商が 13 になり 17 より小さいので、素数と判定されて返ります。

## ここがすごい

関数の前に置かれた長いコメントが考え方を説明しています。よくある実装は「奇数だけを候補にする」（2 の倍数を除く）か、「2 と 3 の倍数を除く」です。この実装は **2, 3, 5, 7 の倍数を除きます**。

210 個の数のうち、候補になるのは 48 個だけです。奇数だけを調べる場合（105 個）と比べると、候補の数は半分以下になります。しかも同じ規則で **割る数** も絞っているので、試し割りの回数も減ります。

√n の判定を `q < p` で書いているのも工夫です。`p * p > n` と書くと掛け算があふれる恐れがありますし、`sqrt` を呼ぶと浮動小数点の計算が必要です。割り算の商は、割り切れるかの判定（`n == q * p`）にも使い回せるので無駄がありません。

`goto` は嫌われがちですが、二重ループの奥から「次の候補へ」と一気に抜けるこの場面では、フラグ変数を使うよりも素直に読めます。

## まとめ

- 小さな素数の積（ここでは 210）を周期にすると、倍数を最初から候補に入れずに済む。
- 試し割りの終了条件は、`p * p > n` ではなく「商 < 割る数」にすると桁あふれしない。
- 割り算の商は、割り切れるかの判定にも再利用できる。
- 多重ループを一度に抜けたいときは、`goto` が読みやすい選択肢になることがある。
