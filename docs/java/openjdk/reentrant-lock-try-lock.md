---
title: "同じスレッドの再入回数を int で数え、溢れたら例外にする"
description: "Java 標準の ReentrantLock.Sync.tryLock。ロックの状態値に保持回数を入れ、同じスレッドが再び取るたびに 1 増やす。int が溢れて負になったら、そこで検出して例外にする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/locks/ReentrantLock.java
lines: [126, 141]
function: "ReentrantLock.Sync.tryLock"
difficulty: 2
format: 2
tags: [並行処理, 数値計算, ロック不要]
---

## ひとことで

`ReentrantLock` は、同じスレッドが何度でも取り直せる（再入できる）ロックです。取った回数は、ロックの状態の `int` に数として入っています。

`tryLock` は、ロックを取ろうとするメソッドです。誰も持っていなければ、1 回目として取ります。同じスレッドがすでに持っていれば、回数を 1 増やします。増やした結果が負になったら、`int` が溢れたということなので、エラーを投げます。

## コード

::: code-group

```java:line-numbers=126 [日本語訳]
        final boolean tryLock() {
            Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (compareAndSetState(0, 1)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            } else if (getExclusiveOwnerThread() == current) {
                if (++c < 0) // if (++c < 0) // 溢れ（int の最大値を超えて、負の数になった）
                    throw new Error("Maximum lock count exceeded");
                setState(c);
                return true;
            }
            return false;
        }
```

```java:line-numbers=126 [原文]
        final boolean tryLock() {
            Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (compareAndSetState(0, 1)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            } else if (getExclusiveOwnerThread() == current) {
                if (++c < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(c);
                return true;
            }
            return false;
        }
```

:::

## 前提知識

- **再入可能（reentrant）**: 同じスレッドが、すでに持っているロックを、もう一度取れることです。取った回数の分だけ、解放が必要になります。
- **状態（state）**: AQS（キューを使う同期の土台）が持つ `int` の値です。`ReentrantLock` では、保持の回数を表します。
- **`compareAndSetState(0, 1)`**: 状態が 0 のときだけ 1 に変える操作です。複数のスレッドが同時に取ろうとしても、1 つだけが成功します。
- **`getExclusiveOwnerThread()`**: 今ロックを持っているスレッドを返します。
- **整数の溢れ**: `int` の最大値に 1 を足すと、最小値（負の数）に折り返します。

## 何をしているか

### 1. 誰も持っていなければ、CAS で取る

```java:line-numbers=129
            if (c == 0) {
                if (compareAndSetState(0, 1)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
```

状態が 0 のときは、ロックを持っている人がいません。`compareAndSetState(0, 1)` で状態を 1 にし、持ち主として今のスレッドを記録します。CAS が失敗したら、ほかのスレッドが先に取ったので、下の判定に進まずに `false` を返します。

### 2. 自分が持っていれば、回数を増やす

```java:line-numbers=134
            } else if (getExclusiveOwnerThread() == current) {
                if (++c < 0) // if (++c < 0) // 溢れ（int の最大値を超えて、負の数になった）
                    throw new Error("Maximum lock count exceeded");
                setState(c);
                return true;
```

状態が 0 でないとき、持ち主が今のスレッドなら、再入です。回数 `c` を 1 増やします。増やした結果が負になったら、`int` が最大値を超えて溢れたことになるので、`Error` を投げます。正常なら、新しい回数を `setState` で保存し、`true` を返します。

### 3. 持ち主でなければ、取れない

```java:line-numbers=140
            return false;
```

状態が 0 でなく、持ち主も別のスレッドなら、取れません。`false` を返します。

## ここがすごい

- **溢れを符号で判定する**: `++c < 0` の 1 回の比較で、`int` の溢れを見つけます。最大値を事前に比べる必要がありません。
- **状態の値を 1 つにまとめる**: 「ロックを持っているか」と「何回取ったか」を、同じ `int` で表しています。CAS で 1 回に更新でき、2 つがずれることがありません。
- **持ち主の確認と再入を分ける**: 0 のときの取得と、持ち主が自分のときの再入を、別の枝で扱うので、判定が明確です。
- **溢れを黙って見過ごさない**: 負に折り返った回数をそのまま使うと、ロックが正しく解放されなくなります。早い段階で `Error` にして、問題を知らせます。

## まとめ

- `tryLock` は、状態が 0 なら CAS で取り、持ち主が自分なら回数を 1 増やす。
- 回数を増やした結果が負になったら、`int` の溢れとして `Error` を投げる。
- 状態の値 1 つで「持っているか」と「何回か」を表すので、CAS で安全に更新できる。
