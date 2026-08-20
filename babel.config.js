module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Inlines .sql migration file contents as string literals at build time, since Metro can't
    // read files off disk at runtime — see drizzle.config.ts and src/db/migrate.ts.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
