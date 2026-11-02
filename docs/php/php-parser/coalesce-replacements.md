---
title: 削除と追加が並んだら、置き換えとしてまとめる
description: PHP-Parser の coalesceReplacements は、差分の中で削除の並びと追加の並びが同じ長さなら、置き換えとして 1 つずつにまとめます。コードの整形結果を、読みやすい差分として出すための処理です。
language: php
project: PHP-Parser
repo: https://github.com/nikic/PHP-Parser
license: BSD-3-Clause
copyright: Copyright (c) 2011, Nikita Popov
commit: "1ee86c89e58a23810602e78ca445784bb7b2ad3e"
file: lib/PhpParser/Internal/Differ.php
lines: [142, 177]
function: Differ::coalesceReplacements
difficulty: 2
format: 2
tags: [アルゴリズム, データ構造, パース]
---
## ひとことで

`coalesceReplacements` は、差分の並びの中から「削除されたあとに追加された」部分を探し、同じ数どうしなら置き換え（`REPLACE`）としてまとめ直す関数です。差分をそのまま出すと、1 行の書き換えが「削除 1 行、追加 1 行」に分かれてしまうので、それを 1 つの操作にまとめます。

## コード

```php:line-numbers=142
    private function coalesceReplacements(array $diff): array {
        $newDiff = [];
        $c = \count($diff);
        for ($i = 0; $i < $c; $i++) {
            $diffType = $diff[$i]->type;
            if ($diffType !== DiffElem::TYPE_REMOVE) {
                $newDiff[] = $diff[$i];
                continue;
            }

            $j = $i;
            while ($j < $c && $diff[$j]->type === DiffElem::TYPE_REMOVE) {
                $j++;
            }

            $k = $j;
            while ($k < $c && $diff[$k]->type === DiffElem::TYPE_ADD) {
                $k++;
            }

            if ($j - $i === $k - $j) {
                $len = $j - $i;
                for ($n = 0; $n < $len; $n++) {
                    $newDiff[] = new DiffElem(
                        DiffElem::TYPE_REPLACE, $diff[$i + $n]->old, $diff[$j + $n]->new
                    );
                }
            } else {
                for (; $i < $k; $i++) {
                    $newDiff[] = $diff[$i];
                }
            }
            $i = $k - 1;
        }
        return $newDiff;
    }
```

## 前提知識

- **差分の要素**: この関数の入力は、`DiffElem` という要素の列です。各要素は「残す（KEEP）」「削除（REMOVE）」「追加（ADD）」「置き換え（REPLACE）」のどれかの種類（`type`）を持ちます。
- **`$diff[$i]->type`**: 配列の `$i` 番目の要素の `type` プロパティを読みます。`->` はオブジェクトのプロパティを指す書き方です。
- **`continue`**: ループの残りを飛ばして、次の繰り返しに進みます。
- **`while`**: 条件が真のあいだ繰り返す制御構文です。ここでは「同じ種類が続くあいだ」の範囲を数えるのに使います。
- **`new DiffElem(...)`**: 新しいオブジェクトを作るときの書き方です。

## 何をしているか

### 1. 残す要素はそのまま通す

```php:line-numbers=145
        for ($i = 0; $i < $c; $i++) {
            $diffType = $diff[$i]->type;
            if ($diffType !== DiffElem::TYPE_REMOVE) {
                $newDiff[] = $diff[$i];
                continue;
            }
```

まず、先頭から 1 つずつ見ていきます。削除（`REMOVE`）でない要素は、何もせず新しい配列に入れます。まとめの対象は削除の並びだけです。

### 2. 削除が続く範囲を数える

```php:line-numbers=152
            $j = $i;
            while ($j < $c && $diff[$j]->type === DiffElem::TYPE_REMOVE) {
                $j++;
            }
```

削除が見つかったら、その後ろに削除が続く範囲を `$j` まで進めます。`$j - $i` は、連続する削除の数です。

### 3. その後ろに続く追加を数える

```php:line-numbers=157
            $k = $j;
            while ($k < $c && $diff[$k]->type === DiffElem::TYPE_ADD) {
                $k++;
            }
```

削除の並びのすぐ後に、追加の並びが続いているかを調べます。`$k - $j` が、連続する追加の数です。

### 4. 数が同じなら置き換えにする

```php:line-numbers=162
            if ($j - $i === $k - $j) {
                $len = $j - $i;
                for ($n = 0; $n < $len; $n++) {
                    $newDiff[] = new DiffElem(
                        DiffElem::TYPE_REPLACE, $diff[$i + $n]->old, $diff[$j + $n]->new
                    );
                }
```

削除の数と追加の数が同じなら、1 組ずつ対応させて `REPLACE` を作ります。`$diff[$i + $n]->old` は消された古い要素で、`$diff[$j + $n]->new` は追加された新しい要素です。たとえば「`$x = 1;` を削除して `$x = 2;` を追加した」なら、「`$x = 1;` を `$x = 2;` に置き換えた」1 行になります。

### 5. 数が違えばそのまま出す

```php:line-numbers=169
            } else {
                for (; $i < $k; $i++) {
                    $newDiff[] = $diff[$i];
                }
            }
            $i = $k - 1;
```

削除と追加の数が違うときは、対応させられません。そのまま、削除と追加をすべて順に出力します。最後の `$i = $k - 1` で、ループの次の繰り返しが `$k` の位置から始まるようにしています。

## ここがすごい

- **1 組ずつ対応させる単純さ**: 削除と追加を 1 対 1 で組にできるときだけ置き換えにする、という単純な規則です。複雑な類似度の計算は使っていません。
- **数が違うときは壊さない**: 置き換えにできないときは、差分の情報をそのまま残します。無理に組み合わせると、読む人が誤解する差分になるからです。
- **同じ場所を 2 回読まない**: `$i = $k - 1` で、まとめた範囲をまとめて飛ばしています。二重の走査にならないよう工夫されています。
- **結果が読みやすくなる**: 削除と追加が別々に並ぶより、「この行をこう変えた」と表示できるので、コードの変更点を一目で追えます。

## まとめ

- 差分の「削除の並び」と「追加の並び」を見つけ、数が同じなら `REPLACE` にまとめる。
- 1 対 1 で対応させられないときは、差分をそのまま残す。
- `$i = $k - 1` で、まとめた範囲を二重に読まないようにしている。
- 差分の表示を読みやすくするのは、こうした小さな後処理の積み重ね。
