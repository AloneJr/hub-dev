const cards = document.querySelectorAll('.card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calcula a rotação baseada na posição do mouse
        const xRotation = ((y - rect.height / 2) / rect.height) * -5; // Max 5 deg
        const yRotation = ((x - rect.width / 2) / rect.width) * 5;

        card.style.transform = `
            perspective(1000px) 
            scale(1.02)
            rotateX(${xRotation}deg) 
            rotateY(${yRotation}deg)
        `;
    });

    card.addEventListener('mouseleave', () => {
        // Reseta a posição quando o mouse sai
        card.style.transform = 'perspective(1000px) scale(1) rotateX(0) rotateY(0)';
    });
});