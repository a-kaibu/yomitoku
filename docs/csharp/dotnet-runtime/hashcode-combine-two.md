---
title: "2 つのハッシュ値を混ぜて、ばらつきのある 1 つの値にする"
description: "System.HashCode.Combine(T1, T2) の中身。ランダムな種と定数を使い、2 つの値を xxHash の手順で混ぜてから最後に MixFinal で各ビットを撹拌する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/HashCode.cs
lines: [97, 110]
function: "HashCode.Combine<T1, T2>"
difficulty: 3
format: 2
tags: [ハッシュ, 乱数, 数値計算]
---

## ひとことで

`HashCode.Combine(value1, value2)` は、**2 つの値のハッシュコードを 1 つにまとめる** 関数です。
たとえば、`(x, y)` という座標や、複数のフィールドを持つ独自のクラスの `GetHashCode()` を作るときに使われます。

ただ数字を足すだけでは、`(1, 2)` と `(2, 1)` が同じ値になってしまいます。この関数は、順番や値の違いがきちんと結果に反映されるように、xxHash という高速なハッシュ方式の手順を使って値を混ぜています。

## コード

```csharp:line-numbers=97
        public static int Combine<T1, T2>(T1 value1, T2 value2)
        {
            uint hc1 = (uint)(value1?.GetHashCode() ?? 0);
            uint hc2 = (uint)(value2?.GetHashCode() ?? 0);

            uint hash = MixEmptyState();
            hash += 8;

            hash = QueueRound(hash, hc1);
            hash = QueueRound(hash, hc2);

            hash = MixFinal(hash);
            return (int)hash;
        }
```

## 前提知識

- **ハッシュコード**: 値から作られる 32 ビットの整数です。同じ値なら同じハッシュコードになり、違う値でも同じになることがあります（衝突）。
- **`GetHashCode()`**: オブジェクトのハッシュコードを返すメソッドです。
- **`?.` と `??`**: `value1?.GetHashCode()` は、`value1` が `null` なら `null` を返します。`?? 0` は、`null` なら 0 にします。
- **xxHash**: 速くて分布のよいハッシュ方式です。乱数で始まりの値（種）を決め、定数で掛け算とシフトを繰り返します。
- **`s_seed`**: プロセスごとに 1 度だけ作られるランダムな種です。

## 何をしているか

### 1. 2 つのハッシュ値を取り出す

```csharp:line-numbers=99
            uint hc1 = (uint)(value1?.GetHashCode() ?? 0);
            uint hc2 = (uint)(value2?.GetHashCode() ?? 0);
```

それぞれの値のハッシュコードを `uint` として取り出します。`null` は 0 として扱います。

### 2. 初期値を作り、2 つを順に混ぜる

```csharp:line-numbers=102
            uint hash = MixEmptyState();
            hash += 8;

            hash = QueueRound(hash, hc1);
            hash = QueueRound(hash, hc2);
```

`MixEmptyState()` は `s_seed + Prime5` を返し、ランダムな初期値になります。`hash += 8` は、入力が 8 バイト（2 つの `int`）ぶんだという情報を混ぜています。

そのあと、`QueueRound` で 1 つずつ混ぜます。`QueueRound` は次の式です。

```csharp:line-numbers=273
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static uint QueueRound(uint hash, uint queuedValue)
        {
            return BitOperations.RotateLeft(hash + queuedValue * Prime3, 17) * Prime4;
        }
```

`hash + queuedValue * Prime3` を作り、17 ビット回転して `Prime4` を掛けます。掛け算と回転を組み合わせることで、ビットが上下に広がります。

### 3. 最後に全体を撹拌する

```csharp:line-numbers=108
            hash = MixFinal(hash);
            return (int)hash;
```

`MixFinal` は次の手順で、すべてのビットを混ぜ直します。

```csharp:line-numbers=291
        private static uint MixFinal(uint hash)
        {
            hash ^= hash >> 15;
            hash *= Prime2;
            hash ^= hash >> 13;
            hash *= Prime3;
            hash ^= hash >> 16;
            return hash;
        }
```

右シフトと XOR、掛け算を交互に行います。最後の値が `int` として返されます。

## ここがすごい

- **順番が結果に効く**: `QueueRound` は値を順に混ぜるので、`(1, 2)` と `(2, 1)` は違うハッシュ値になります。単なる足し算では起きない性質です。
- **ランダムな種で攻撃に強くする**: 種が毎回変わるので、同じハッシュ値になる値を事前に作って攻撃することが難しくなります（ハッシュ衝突攻撃への対策）。
- **`MixFinal` で偏りを消す**: 掛け算だけでは下位ビットの偏りが残りやすいので、シフトと XOR で上位の情報を下位に戻しています。
- **定数は xxHash の値**: 素数の定数は、ばらつきがよい値として xxHash の作者が選んだものです。自分で適当な数字を選ぶより、実績のある値を使うほうが安全です。

## まとめ

- ハッシュの合成は、順番が効くように混ぜる必要がある。
- 乱数の種を使うと、外部からハッシュ値を狙う攻撃を防げる。
- 最後の撹拌（MixFinal）で、各ビットの値をまんべんなく散らせる。
