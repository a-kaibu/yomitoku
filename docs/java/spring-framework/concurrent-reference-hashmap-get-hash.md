---
title: "hashCode の偏りを、シフトと加算で散らす"
description: "Spring Framework の ConcurrentReferenceHashMap.getHash。オブジェクトの hashCode をシフト・加算・XOR で混ぜ直し、ハッシュ表のバケットに値が偏らないようにする。"
language: java
project: Spring Framework
repo: https://github.com/spring-projects/spring-framework
license: Apache-2.0
copyright: "Copyright 2002-present the original author or authors."
commit: "ed4e0f896bc01279196a2c370fbfd15c7b201eed"
file: spring-core/src/main/java/org/springframework/util/ConcurrentReferenceHashMap.java
lines: [247, 256]
function: "ConcurrentReferenceHashMap.getHash"
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, キャッシュ]
---

## ひとことで

`getHash(o)` は、オブジェクトの `hashCode()` を受け取り、ハッシュ表で使う値に混ぜ直して返します。`null` のキーは 0 として扱われます。

`hashCode()` の値は、クラスによっては下位のビットに偏りがあります。そのまま使うと、ハッシュ表の一部のバケットに値が集中してしまいます。この関数は、その偏りを減らすための仕上げ処理です。

## コード

```java:line-numbers=247
	protected int getHash(@Nullable Object o) {
		int hash = (o != null ? o.hashCode() : 0);
		hash += (hash << 15) ^ 0xffffcd7d;
		hash ^= (hash >>> 10);
		hash += (hash << 3);
		hash ^= (hash >>> 6);
		hash += (hash << 2) + (hash << 14);
		hash ^= (hash >>> 16);
		return hash;
	}
```

## 前提知識

- **`hashCode()`**: オブジェクトから整数を作るメソッドです。`HashMap` などが、格納場所を決めるときに使います。
- **ハッシュ表のバケット**: ハッシュ値を剰余などで割り当てた格納場所です。値が偏ると、1 つの場所に要素が集まり、検索が遅くなります。
- **`<<`（左シフト）と `>>>`（符号なし右シフト）**: ビットを左または右へずらす演算です。上の桁の変化を下の桁へ伝えたり、その逆をしたりします。
- **`^`（XOR）**: 同じ桁が違えば 1 になります。ビットの混ぜ方として使われます。
- **`@Nullable`**: `null` を許すことを示す注釈です。`null` のときは 0 から始めます。

## 何をしているか

### 1. null を 0 にして開始する

```java:line-numbers=248
		int hash = (o != null ? o.hashCode() : 0);
```

`o` が `null` でなければ `hashCode()` を使い、`null` なら 0 から始めます。キーが `null` でも、例外を出さずにハッシュ値を作れます。

### 2. 定数と左シフトを足す

```java:line-numbers=249
		hash += (hash << 15) ^ 0xffffcd7d;
```

`(hash << 15) ^ 0xffffcd7d` は、元の値を 15 ビット左へずらし、定数と XOR したものです。これを元の値に足すと、下位の桁に上位の情報が入り込みます。

### 3. 右シフトと XOR で上の桁を下へ戻す

```java:line-numbers=250
		hash ^= (hash >>> 10);
```

`hash ^= (hash >>> 10)` は、上の桁を下へ XOR で混ぜます。

### 4. 加算と XOR を交互に繰り返す

```java:line-numbers=251
		hash += (hash << 3);
		hash ^= (hash >>> 6);
		hash += (hash << 2) + (hash << 14);
		hash ^= (hash >>> 16);
```

残りの行は、左シフトの加算と、右シフトの XOR を交互に行います。`(hash << 2) + (hash << 14)` は、4 倍と 16384 倍を足すことで、違う桁へ情報を広げます。最後の `>>> 16` の XOR で、上の桁の情報が下位の桁へ伝わります。

## ここがすごい

- **シフトと加算だけで混ぜる**: 掛け算を使わず、シフトと加算、XOR だけで混ぜています。CPU で速く動く演算だけを組み合わせています。
- **上と下の桁を行き来させる**: 左シフトは下の情報を上へ、右シフトは上の情報を下へ伝えます。この往復によって、どのビットの違いも全体に広がります。
- **定数の出どころはコードからは読めない**: `0xffffcd7d` の意味は、このコードだけでは分かりません。ただ、偏りを減らす混ぜ方の一部として書かれていることは読み取れます。
- **`null` を特別扱いしない**: `null` を 0 として扱うので、呼び出し側はキーの null チェックをしなくて済みます。

## まとめ

- `hashCode` の値を、シフトと加算、XOR を繰り返して混ぜ直す。
- 上の桁の情報を下へ、下の桁の情報を上へ伝えて、偏りを減らす。
- `null` は 0 として扱い、例外なくハッシュ値を作る。
