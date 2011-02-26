        </div>
        <div class="clear"></div>
        <div id="admin_footer">&copy; ROSA Operating System 2011 ( chokchai.puttan@gmail.com )</div>
        <script> var BASE_URL = "<?=$base_url?>"; </script>
        <?php foreach ($js as $src): ?>
        <script src="<?= site_url($src) ?>" type="text/javascript"></script>
        <?php endforeach; ?>
    </body>
</html>
