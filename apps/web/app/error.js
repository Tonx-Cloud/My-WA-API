'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  );
}
