"""
CLI Commands

Command-line interface for the translation bot
"""

import asyncio
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from ..core.translation_agent import TranslationBot

console = Console()


@click.group()
def cli():
    """ROMA Translation Bot - Multi-provider translation with DeepL/Azure/LibreTranslate"""
    pass


@cli.command()
@click.argument('text')
@click.option('--to', '-t', multiple=True, required=True, help='Target languages (e.g., -t es -t fr -t de)')
@click.option('--from', '-f', 'source', default=None, help='Source language (auto-detect if not specified)')
def translate(text, to, source):
    """Translate text using multi-provider translation service"""
    
    async def run():
        try:
            bot = TranslationBot()
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task(
                    f"[cyan]Translating to {len(to)} language(s)...",
                    total=None
                )
                
                result = await bot.translate(
                    text=text,
                    target_languages=list(to),
                    source_language=source
                )
            
            # Display results
            console.print(f"\n[green]✓[/green] Translation complete!", style="bold")
            console.print(f"[dim]Source: {result['source_language']}")
            console.print(f"[dim]Provider: {result['metadata']['provider']}")
            console.print(f"[dim]Time: {result['processing_time_ms']}ms\n")
            
            table = Table(title="Translations")
            table.add_column("Language", style="cyan", width=15)
            table.add_column("Translation", style="green")
            table.add_column("Quality", style="yellow", width=10)
            
            for lang in to:
                quality = result['quality_scores'].get(lang, 0)
                quality_str = f"{quality:.2f}"
                table.add_row(
                    lang.capitalize(),
                    result['translations'][lang],
                    quality_str
                )
            
            console.print(table)
        
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
            raise click.Abort()
    
    asyncio.run(run())


@cli.command()
@click.argument('file_path', type=click.Path(exists=True))
@click.option('--to', '-t', multiple=True, required=True)
@click.option('--from', '-f', 'source', default=None)
def translate_file(file_path, to, source):
    """Translate entire file"""
    
    async def run():
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            console.print(f"[cyan]Reading file: {file_path}")
            console.print(f"[dim]Size: {len(text)} characters\n")
            
            bot = TranslationBot()
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
            ) as progress:
                task = progress.add_task(
                    "[cyan]Translating file...",
                    total=None
                )
                
                result = await bot.translate(
                    text=text,
                    target_languages=list(to),
                    source_language=source
                )
            
            # Save translations
            import os
            base_name = os.path.splitext(file_path)[0]
            
            for lang, translation in result['translations'].items():
                output_file = f"{base_name}.{lang}.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(translation)
                console.print(f"[green]✓[/green] Saved: {output_file}")
            
            console.print(f"\n[green]Done![/green] ({result['processing_time_ms']}ms)")
        
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
            raise click.Abort()
    
    asyncio.run(run())


@cli.command()
def languages():
    """List supported languages"""
    
    from ..core.config_loader import get_config_loader
    
    config_loader = get_config_loader()
    languages_dict = config_loader.get_languages()
    
    table = Table(title="Supported Languages")
    table.add_column("Code", style="cyan", width=10)
    table.add_column("Language", style="green")
    table.add_column("Native Name", style="yellow")
    
    for code, info in languages_dict.items():
        table.add_row(
            code,
            info.get("name", code),
            info.get("native_name", "")
        )
    
    console.print(table)


@cli.command()
@click.argument('text')
def detect(text):
    """Detect language of text"""
    
    async def run():
        try:
            bot = TranslationBot()
            lang = await bot.detect_language(text)
            console.print(f"\n[green]Detected language:[/green] [cyan]{lang}[/cyan]")
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
            raise click.Abort()
    
    asyncio.run(run())


@cli.command()
def info():
    """Show bot configuration and status"""
    
    try:
        console.print("\n[bold cyan]ROMA Translation Bot[/bold cyan]")
        console.print("[dim]Multi-Provider Translation (DeepL/Azure/LibreTranslate)\n")
        
        # Check translation providers
        import os
        if os.getenv("DEEPL_API_KEY"):
            console.print("[green]✓[/green] DeepL API key configured")
        else:
            console.print("[yellow]![/yellow] DeepL API key not found")
        
        if os.getenv("AZURE_TRANSLATOR_KEY"):
            console.print("[green]✓[/green] Azure Translator key configured")
        else:
            console.print("[yellow]![/yellow] Azure Translator key not found")
        
        console.print("[green]✓[/green] LibreTranslate available (no key needed)")
        
        # Check database
        if os.path.exists("data/translations.db"):
            console.print("[green]✓[/green] SQLite database ready")
        else:
            console.print("[yellow]![/yellow] Database not initialized")
            console.print("[dim]  Run: python scripts/setup_db.py")
        
        # Show stats
        async def show_stats():
            bot = TranslationBot()
            stats = bot.get_stats()
            
            console.print("\n[bold]Statistics:[/bold]")
            console.print(f"  Cache: {stats['cache']['active_entries']} active entries")
            
            console.print("\n[bold]Translation Providers:[/bold]")
            for provider, data in stats['translation_service'].items():
                status = "[green]✓[/green]" if data['enabled'] else "[red]✗[/red]"
                console.print(f"  {status} {provider}: {data['usage_count']} translations")
        
        asyncio.run(show_stats())
        console.print()
    
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")


if __name__ == '__main__':
    cli()

