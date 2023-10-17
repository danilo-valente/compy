FROM denoland/deno:alpine-1.36.3

EXPOSE 3000

WORKDIR /app

ADD . .

RUN deno install -n compy   --allow-env --allow-read --allow-write --allow-run --allow-sys --allow-net --unstable   --import-map='https://deno.land/x/compy@v0.1.1/import_map.json'   -f 'https://deno.land/x/compy@v0.1.1/run.ts'

# Cache the main app so that it doesn't need to be cached on each startup/entry.
RUN compy cache lib

RUN compy start -e ash lib > compy.sh && chmod +x compy.sh

CMD ["./compy.sh"]
