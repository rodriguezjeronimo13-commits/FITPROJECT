function healthScore(food) {
  const calorias = Number(food.calorias) || 1;
  const proteinas = Number(food.proteinas) || 0;
  const grasas = Number(food.grasas) || 0;
  const proteinRatio = proteinas / calorias;
  const fatRatio = grasas / calorias;
  let score = Math.round(55 + proteinRatio * 520 - fatRatio * 180);
  score = Math.max(30, Math.min(98, score));
  let etiqueta = 'A mejorar';
  if (score >= 80) etiqueta = 'Muy saludable';
  else if (score >= 65) etiqueta = 'Saludable';
  else if (score >= 45) etiqueta = 'Moderado';
  return { puntaje: score, etiqueta };
}

function withNutrition(food) {
  return { ...food, ...healthScore(food) };
}

module.exports = { healthScore, withNutrition };
