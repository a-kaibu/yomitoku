---
title: "押した瞬間に部品を少し下へずらす"
description: "Water.css は checkbox・radio・submit・button の input と button が active のとき、translateY(2px) で 2px 下へずらし、押した手応えを作る。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [140, 146]
function: "\"input[type='checkbox']:active, input[type='radio']:active, button:active, …\""
difficulty: 2
format: 2
tags: [アニメーション, フォーム]
---
## ひとことで

Water.css は、押している最中のボタンやチェックボックスを、2px だけ下へずらします。押し込まれたような手応えを、画面の動きで伝えるための指定です。

## コード

```css:line-numbers=140
input[type='checkbox']:active,
input[type='radio']:active,
input[type='submit']:active,
input[type='button']:active,
button:active {
  transform: translateY(2px);
}
```

## 前提知識

- **:active**: 要素を押している最中の状態を表す疑似クラスです。マウスのボタンを離すと、元に戻ります。
- **transform: translateY**: 要素を縦方向に移動させる指定です。正の値は下へ、負の値は上へ動きます。
- **変形の時間**: 前の部分で、button と input の transform に 0.1 秒の transition が与えられています。そのため、ずれる動きも滑らかに見えます。

## 何をしているか

### 1. 押している対象

```css:line-numbers=140
input[type='checkbox']:active,
input[type='radio']:active,
input[type='submit']:active,
input[type='button']:active,
button:active {
  transform: translateY(2px);
```

チェックボックス、ラジオ、送信ボタン、通常のボタンが押されている状態を選びます。

### 2. 下にずらす

```css:line-numbers=146
}
```

2px だけ下へ動かします。小さな動きですが、押したことが画面の上で確かめられます。

## ここがすごい

押している間だけ動くので、通常の状態には影響しません。大きな動きではないため、作業の邪魔にもならない控えめな反応です。

押している最中の小さな動きは、押した感覚を画面の変化で補います。ボタンが沈み込むように見えると、操作が受け付けられたことが分かりやすくなります。位置の変化は 2px と控えめで、周りのレイアウトを動かさない大きさです。hover の色の変化と組み合わせると、マウスを乗せ、押し、離す、という一連の反応が自然に続きます。

## まとめ

:active と translateY を組み合わせると、押し込む感覚を、位置の小さなずれで表現できます。
