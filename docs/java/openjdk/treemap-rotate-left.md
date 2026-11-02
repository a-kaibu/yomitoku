---
title: "赤黒木を、親子の関係を保って左へ回す"
description: "Java 標準の TreeMap.rotateLeft。木の一つの節を左へ回転させ、大小の順番を崩さずに高さを変える。赤黒木の再調整で使われる基本の操作。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/TreeMap.java
lines: [2587, 2603]
function: "TreeMap.rotateLeft"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`TreeMap.rotateLeft(p)` は、2 分木の節 `p` を左へ回転させます。回転の後も、中順（小さい値から大きい値への並び）は変わりません。

`TreeMap` は赤黒木という自己調整の木で、要素の追加や削除のあとに、木のバランスを保つために回転を使います。この関数は、その基本の操作です。

## コード

```java:line-numbers=2587
    private void rotateLeft(Entry<K,V> p) {
        if (p != null) {
            Entry<K,V> r = p.right;
            p.right = r.left;
            if (r.left != null)
                r.left.parent = p;
            r.parent = p.parent;
            if (p.parent == null)
                root = r;
            else if (p.parent.left == p)
                p.parent.left = r;
            else
                p.parent.right = r;
            r.left = p;
            p.parent = r;
        }
    }
```

## 前提知識

- **2 分探索木**: 左の子は親より小さく、右の子は親より大きい木です。中順で辿ると、値が昇順に並びます。
- **赤黒木**: 節に赤と黒の色を付けて、木の高さを対数の範囲に保つ木です。`TreeMap` の内部で使われています。
- **回転**: 親と子の位置を入れ替えて、木の形を変える操作です。順番は保たれます。
- **親（parent）への参照**: 各節が親を指しているので、回転のあとで親の子の参照も直す必要があります。
- **`null` の扱い**: 子がない場合は `null` です。回転では `null` を確かめてから処理します。

## 何をしているか

### 1. 右の子を取り出す

```java:line-numbers=2588
        if (p != null) {
            Entry<K,V> r = p.right;
```

回転させる節 `p` の右の子 `r` を取り出します。左へ回転すると、`r` が新しい親になります。

### 2. r の左の部分木を p の右へ移す

```java:line-numbers=2590
            p.right = r.left;
            if (r.left != null)
                r.left.parent = p;
```

`r` の左の部分木は、`p` より大きく `r` より小さい値の集まりです。これを `p` の右の子に付け替えると、大小の順番が保たれます。付け替えた部分木の親も、`p` に直します。

### 3. r を親の位置に置く

```java:line-numbers=2593
            r.parent = p.parent;
            if (p.parent == null)
                root = r;
            else if (p.parent.left == p)
                p.parent.left = r;
            else
                p.parent.right = r;
```

`r` の親を `p` の親にし、`p` の親が持っていた `p` への参照を `r` へ変えます。`p` が根だった場合は、`root` を `r` にします。

### 4. p を r の左の子にする

```java:line-numbers=2600
            r.left = p;
            p.parent = r;
```

最後に、`p` を `r` の左の子にして、親の参照も `r` に向けます。これで、`r` が `p` の位置に立った形になります。

## ここがすごい

- **順番を保つ**: 回転は、中順で見た値の並びを変えません。だから、木を組み替えても、`TreeMap` の検索や走査は正しく動き続けます。
- **わずかな付け替えで済む**: 回転は、参照を数本付け替えるだけです。木全体を作り直さないので、速く行えます。
- **高さを変える**: 右の部分が重すぎる場合に左へ回すと、右の高さが下がります。赤黒木は、この操作を組み合わせてバランスを回復します。
- **参照の付け替えが丁寧**: 親の参照と子の参照を、すべて更新しています。順番を誤ると、木が壊れるため、この 17 行に大事な手順が詰まっています。

## まとめ

- 左回転は、右の子を新しい親にし、中順を変えずに木の形だけを変える。
- 子の付け替えと親の参照の更新を、正しい順番で行う。
- この回転を組み合わせて、赤黒木はバランスを保っている。
