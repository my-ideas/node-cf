---
layout: default
---
<div class="home">
  {%- if page.title -%}
    <h1 class="page-heading">{{ page.title }}</h1>
  {%- endif -%}

  {{ content }}

  {%- if site.posts.size > 0 -%}
    <ul class="post-list">
      {%- for post in site.posts -%}
      <li>
        <h2>
            {{ post.title | escape }}
        </h2>
        {%- if site.show_excerpts -%}
          {{ post.content }}
        {%- endif -%}
      </li>
      {%- endfor -%}
    </ul>

  {%- endif -%}

</div>
