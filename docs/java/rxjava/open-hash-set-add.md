---
title: "配列の隣へ順に置く集合で、ハッシュの偏りを黄金比で散らす"
description: "RxJava の OpenHashSet.add。配列に直接入れる開番地法の集合で、ハッシュ値を黄金比の定数で混ぜ、隣の位置へ順に探して空きに置く。"
language: java
project: RxJava
repo: https://github.com/ReactiveX/RxJava
license: Apache-2.0
copyright: "Copyright (c) 2016-present, RxJava Contributors."
commit: "b0e8737b956f05cebca961899193c80104c94941"
file: src/main/java/io/reactivex/rxjava4/internal/util/OpenHashSet.java
lines: [57, 83]
function: "OpenHashSet.add"
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, アルゴリズム]
---

## ひとことで

`OpenHashSet` は、`HashMap` のように連結リストを使わず、1 つの配列に要素を直接入れる集合です。`add(value)` は、値のハッシュ値から置く位置を決め、同じ値がなければ、その位置か、隣の空いている位置に入れます。

RxJava の `CompositeDisposable` は、解除が必要な購読（Disposable）をまとめて持つときに、この集合を使っています。重複を入れず、オブジェクトを余計に作らないことを重視した設計です。

## コード

```java:line-numbers=57
    public boolean add(T value) {
        final T[] a = keys;
        final int m = mask;

        int pos = mix(value.hashCode()) & m;
        T curr = a[pos];
        if (curr != null) {
            if (curr.equals(value)) {
                return false;
            }
            for (;;) {
                pos = (pos + 1) & m;
                curr = a[pos];
                if (curr == null) {
                    break;
                }
                if (curr.equals(value)) {
                    return false;
                }
            }
        }
        a[pos] = value;
        if (++size >= maxSize) {
            rehash();
        }
        return true;
    }
```

## 前提知識

- **ハッシュ値**: `hashCode()` が返す整数です。同じ値なら同じハッシュ値になります。
- **開番地法（open addressing）**: 衝突したとき、別の場所（ここでは隣の位置）を探して入れる方法です。連結リストを使わないので、メモリが一続きで済みます。
- **線形探索**: 位置を 1 つずつずらして順に探すことです。`pos = (pos + 1) & m` が、その 1 歩に当たります。
- **マスク `m`**: 配列の長さが 2 の累乗なら、`& (長さ - 1)` で、配列の範囲に収まる位置を作れます。
- **黄金比の定数**: `0x9E3779B9` は、2 の 32 乗を黄金比で割った値に近い数です。ハッシュの下位ビットを散らすのに使われます。

## 何をしているか

### 1. 値から最初の位置を決める

```java:line-numbers=57
    public boolean add(T value) {
        final T[] a = keys;
        final int m = mask;

        int pos = mix(value.hashCode()) & m;
        T curr = a[pos];
```

`mix(value.hashCode()) & m` で、最初に調べる位置を決めます。`mix` は、後で説明するとおり、ハッシュ値を混ぜて偏りを減らします。`curr` が空でなければ、それは衝突です。同じ値かどうかを `equals` で調べます。

### 2. 空くまで隣へずらして探す

```java:line-numbers=63
        if (curr != null) {
            if (curr.equals(value)) {
                return false;
            }
            for (;;) {
                pos = (pos + 1) & m;
                curr = a[pos];
                if (curr == null) {
                    break;
                }
                if (curr.equals(value)) {
                    return false;
                }
            }
        }
```

同じ値が見つかれば、重複なので `false` を返します。違う値なら、位置を 1 つ進め（`& m` で配列の端から先頭へ戻る）、空いた位置が見つかるまで続けます。途中で同じ値があれば、やはり重複です。

### 3. 置いて、必要なら拡張する

```java:line-numbers=78
        a[pos] = value;
        if (++size >= maxSize) {
            rehash();
        }
        return true;
```

空いた位置に値を置き、`size` を 1 増やします。`size` が `maxSize` に達したら、`rehash` で配列を大きくします。`maxSize` は、容量に `loadFactor` を掛けた値で、配列が埋まりすぎる前に拡張するためのものです。

### 4. ハッシュ値を黄金比で混ぜる

```java:line-numbers=162
    static int mix(int x) {
        final int h = x * INT_PHI;
        return h ^ (h >>> 16);
    }
```

`mix` は、ハッシュ値に `INT_PHI` を掛けて、上位ビットに広がらせます。さらに `h >>> 16` を `^` で合わせて、上位ビットの変化を下位にも伝えます。マスクで下位ビットだけを使うので、この混ぜ方で偏りが減ります。

## ここがすごい

- **オブジェクトを作らない**: 連結リストのノードを作らず、配列に値を直接入れます。大量の集合を作っても、GC の負担が小さくなります。
- **メモリが連続している**: 値が配列の中に並ぶので、キャッシュに乗りやすく、探索が速くなります。
- **黄金比で散らす**: 整数の並びのハッシュ値が規則的でも、掛け算で位置が分散します。
- **重複の判定と追加を 1 回で**: 探索の途中で重複を見つけられるので、追加の前に別の検索を行う必要がありません。

## まとめ

- `OpenHashSet.add` は、ハッシュ値を `mix` で混ぜてから、配列の中で空きを線形探索して置く。
- 同じ値が見つかれば `false` を返し、重複を入れない。
- 容量の一定割合を超えたら `rehash` で拡張し、探索を速く保つ。
