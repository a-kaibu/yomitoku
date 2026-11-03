---
title: "緯度と経度から二点間の距離を求める式"
description: "dbt-utils の haversine_distance。地球を球とみなし、緯度経度から二点間の距離を求める式を SQL の関数だけで書き、単位をマイルかキロメートルで選べる。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/haversine_distance.sql
lines: [17, 30]
function: "default__haversine_distance"
difficulty: 3
tags: [数値計算, アルゴリズム]
format: 2
---

## ひとことで

`haversine_distance` は、二つの地点の緯度と経度から、地表に沿った距離を計算するマクロです。地球を完全な球とみなす「ハバーサイン」という公式を、SQL の関数だけで書いています。単位は `mi`（マイル）と `km`（キロメートル）から選べます。

## コード

```sql:line-numbers=17
{% macro default__haversine_distance(lat1, lon1, lat2, lon2, unit='mi') -%}
{%- if unit == 'mi' %}
    {% set conversion_rate = 1 %}
{% elif unit == 'km' %}
    {% set conversion_rate = 1.60934 %}
{% else %}
    {{ exceptions.raise_compiler_error("unit input must be one of 'mi' or 'km'. Got " ~ unit) }}
{% endif %}

    2 * 3961 * asin(sqrt(power((sin(radians(({{ lat2 }} - {{ lat1 }}) / 2))), 2) +
    cos(radians({{lat1}})) * cos(radians({{lat2}})) *
    power((sin(radians(({{ lon2 }} - {{ lon1 }}) / 2))), 2))) * {{ conversion_rate }}

{%- endmacro %}
```

## 前提知識

- **緯度・経度**: 地球上の位置を表す角度。緯度は南北、経度は東西の位置を表す。
- **ラジアン**: 角度を表す単位。円周の 1/360 が度（°）、2π が一周にあたる。三角関数はラジアンで計算する。
- **`sin` / `cos` / `asin`**: 三角関数と、その逆関数。
- **`power(x, 2)`**: `x` の 2 乗。
- **`nullif(…, 0)`**: 0 のとき `NULL` にする関数。ここでは使っていない。

## 何をしているか

### 1. 単位を決める

単位がマイルなら換算係数は `1`、キロメートルなら `1.60934` を使います。それ以外はコンパイル時にエラーを出して止めます。

```sql:line-numbers=18
{%- if unit == 'mi' %}
    {% set conversion_rate = 1 %}
{% elif unit == 'km' %}
    {% set conversion_rate = 1.60934 %}
{% else %}
    {{ exceptions.raise_compiler_error("unit input must be one of 'mi' or 'km'. Got " ~ unit) }}
{% endif %}
```

### 2. 半分の差の sin を二乗して足す

ハバーサインの式の中心は、緯度と経度の差の半分の正弦（sin）を二乗して足す部分です。

```sql:line-numbers=26
    2 * 3961 * asin(sqrt(power((sin(radians(({{ lat2 }} - {{ lat1 }}) / 2))), 2) +
    cos(radians({{lat1}})) * cos(radians({{lat2}})) *
    power((sin(radians(({{ lon2 }} - {{ lon1 }}) / 2))), 2))) * {{ conversion_rate }}
```

`radians()` で度をラジアンに直し、`(lat2 − lat1) / 2` の sin を 2 乗します。緯度の差と、経度の差に、それぞれ `cos(lat1) * cos(lat2)` を掛けたものを加えた値が、中心角の半分の二乗にあたります。

### 3. 角度から距離に変換する

`asin(sqrt(…))` で中心角を求め、地球の半径（マイルの 3961）を掛けて距離にします。

```sql:line-numbers=26
    2 * 3961 * asin(sqrt(power((sin(radians(({{ lat2 }} - {{ lat1 }}) / 2))), 2) +
    cos(radians({{lat1}})) * cos(radians({{lat2}})) *
    power((sin(radians(({{ lon2 }} - {{ lon1 }}) / 2))), 2))) * {{ conversion_rate }}

{%- endmacro %}
```

`2 * 3961 * asin(…)` の部分が、弧の長さを求める最後の一歩です。`conversion_rate` は、マイルの距離をキロメートルに換算するために使います。

## ここがすごい

- **三角関数だけで、長い距離を近似している**: 地球の形を完全に扱わなくても、地表の距離としては十分な精度が得られます。
- **大きな誤差の出にくい形**: 地点が近いときでも、もとの式より丸め誤差が少ないように、差の半分の sin を使っています。
- **単位を引数で切り替える**: 利用者が換算の式を知らなくても、`unit` だけで単位を変えられます。
- **トレードオフ**: 地球を完全な球とみなすので、楕円体として正確に測る方法より誤差があります。数キロ単位の目安には十分ですが、測量には向きません。

## まとめ

- 地球上の距離は、ハバーサインの式で球面の上の距離として求められる。
- 度とラジアンの変換を忘れると値が大きくずれるので、`radians()` で必ず直す。
- 単位のような選択は、引数の既定値とエラー処理で安全に切り替えられる。
