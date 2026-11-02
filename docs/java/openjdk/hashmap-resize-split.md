---
title: "表を 2 倍にするとき、1 ビットで行き先を 2 つに分ける"
description: "Java 標準の HashMap.resize のうち、連結リストを分割する部分。表の大きさを 2 倍にするとき、ハッシュ値の 1 ビットだけを見て、元の場所か元の場所 + 旧容量へ振り分ける。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/HashMap.java
lines: [740, 778]
function: "HashMap.resize"
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, ビット演算]
---

## ひとことで

`HashMap` は、要素が増えると表（配列）の大きさを 2 倍に広げます。このとき、同じ場所にあった要素を、新しい表の 2 か所のどちらかへ振り分けなければなりません。`resize` のこの部分は、その振り分けを、ハッシュ値の 1 ビットだけを見て行います。

ハッシュ値を計算し直す必要がないので、広げる作業が速く済みます。

## コード

::: code-group

```java:line-numbers=740 [日本語訳]
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // 順序を保つ
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
```

```java:line-numbers=740 [原文]
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
```

:::

## 前提知識

- **ハッシュ表の場所**: 表の大きさを `cap` とすると、要素の場所は `hash & (cap - 1)` で決まります。`cap` は 2 のべき乗なので、`cap - 1` は下位のビットがすべて 1 のマスクになります。
- **バケットと連結リスト**: 同じ場所に入る要素は、一つの連結リストにつながれます。
- **旧容量 `oldCap`**: 広げる前の表の大きさです。新しい表の大きさは、その 2 倍です。
- **`&`（AND）**: 同じ桁がどちらも 1 のときだけ 1 になります。特定のビットを調べるのに使います。
- **`TreeNode`**: 連結リストが長くなったときに、木構造で持っている節です。ここでは別の処理（`split`）に任せています。

## 何をしているか

### 1. 1 つだけの要素はそのまま移す

```java:line-numbers=742
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
```

場所 `j` の要素が 1 つだけなら、新しい表の中の場所を計算して、そこに置くだけです。木の節なら、専用の `split` に任せます。

### 2. 連結リストを 2 つに分ける

```java:line-numbers=748
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
```

リストの各要素について、`e.hash & oldCap` を調べます。この値が 0 なら「低い側」（`lo`）、0 でなければ「高い側」（`hi`）のリストへ、後ろに続けて加えます。元の順番は、そのまま保たれます。

### 3. 2 つのリストを新しい表へ置く

```java:line-numbers=766
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
```

`lo` は元の場所 `j` に、`hi` は `j + oldCap` に置きます。リストの最後の `next` は `null` にして、つながりを終わらせます。

## ここがすごい

- **ハッシュを計算し直さない**: 新しい場所は、元の場所に `oldCap` を足したものか、そのままのどちらかです。どちらになるかは、ハッシュ値の 1 ビットで決まります。
- **1 ビットの判定で済む**: 2 倍に広げると、場所の決め方に増えるのは、新しく見えるようになった 1 ビットだけです。その 1 ビットを `&` で調べるだけで、振り分け先が分かります。
- **順番が保たれる**: 2 つのリストに分けても、それぞれで元の並びを守っています。そのため、同じ場所にあった要素の相対順序が変わりません。
- **新しい配列を最小限に**: 元の表からリストを外して、新しい表へ移すだけです。余計なコピーを作らずに、要素をつなぎ直しています。

## まとめ

- 表を 2 倍にすると、要素の行き先は元の場所か、元の場所 + 旧容量の 2 つだけになる。
- 行き先はハッシュ値の 1 ビット（`hash & oldCap`）で決まり、ハッシュの計算し直しは要らない。
- 2 つのリストに分けるときも、元の順番を保つ。
