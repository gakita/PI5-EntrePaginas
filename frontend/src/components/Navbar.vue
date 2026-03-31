<template>
    <nav>
        <h1>EntrePaginas</h1>
        <ul>
            <li><a href="#">Início</a></li>
            <li><a href="#">Categorias</a></li>
            <li><a href="#">Recomendações</a></li>
            <li><a href="#">Catálogo</a></li>
            <li><a href="Login">Login</a></li>
        </ul>
    </nav>
</template>

<style scope>

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

body{
    font-family: "Playfair Display", sans-serif;
}

a{
    font-weight: 400;
    line-height: 29px;
    letter-spacing: .5px;
    font-style: normal;
}

nav{
    position:fixed;
    display: flex;
    border-bottom: 3px solid rgba(155, 138, 117, 0.25);
    background-color: #1A120B;
    justify-content: space-between;
    padding-inline:1rem;
    padding-block: 1rem;
    width:100%
}

ul{
    display: flex;
    gap: 3.3rem;
}
</style>